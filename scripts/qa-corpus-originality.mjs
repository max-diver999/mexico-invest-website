#!/usr/bin/env node
/**
 * Corpus originality and numeric-coherence gate.
 *
 * The existing gates measure quantity — "at least N numeric facts", "at least 3
 * tables", "at least 4 H2s" — with no ceiling and no cross-file comparison. A
 * generator satisfies all of them by pasting the same padded sentence into every
 * article and filling its numbers from a shared pool, which is exactly what the
 * Phase 0 audit found: 39% of prose duplicated, 82% of files carrying a claim whose
 * units are impossible ("files average $326,000 turnaround", "$200K ISR withholding").
 *
 * Two checks, both of which would have caught that at generation time:
 *
 *   duplicate-sentence  a >=8-word sentence whose number-normalised shape also
 *                       appears in >= DUP_FILE_LIMIT other files
 *   unit-coherence      a currency amount where a duration or a rate belongs, or a
 *                       percentage where a price belongs
 *
 * Usage:
 *   node scripts/qa-corpus-originality.mjs [--changed] [--fail] [--json] [--limit N]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

const argv = process.argv.slice(2);
const failOnIssues = argv.includes('--fail');
const changedOnly = argv.includes('--changed');
const asJson = argv.includes('--json');
const limitArg = Number((argv.find((a) => a.startsWith('--limit=')) ?? '').split('=')[1]) || 12;

/** A shape appearing in this many *other* files is boilerplate, not a coincidence. */
const DUP_FILE_LIMIT = 3;
/** Sentences shorter than this are too generic to judge ("Verify before you sign."). */
const MIN_WORDS = 8;

/* ------------------------------------------------------------------ corpus */

function readAll() {
  const out = [];
  for (const collection of COLLECTIONS) {
    const dir = path.join(CONTENT, collection);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!/\.mdx?$/.test(file)) continue;
      const abs = path.join(dir, file);
      const raw = fs.readFileSync(abs, 'utf8');
      const m = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      out.push({
        collection,
        slug: file.replace(/\.mdx?$/, ''),
        rel: path.relative(ROOT, abs),
        body: m ? m[1] : raw,
      });
    }
  }
  return out;
}

/** Prose only: no code fences, tables, JSX, images, headings or imports. */
function prose(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\|.*$/gm, ' ')
    .replace(/^import .*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6} .*$/gm, ' ');
}

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= MIN_WORDS);
}

/** Collapse every number so a template shows through regardless of its filler. */
function shape(sentence) {
  return sentence
    .toLowerCase()
    .replace(/\$?\d[\d,.]*%?/g, '#')
    .replace(/[^a-z# ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* -------------------------------------------------------- unit coherence */

const MONEY = String.raw`(?:us\$|usd\s*)?\$\s?[\d,]+(?:\.\d+)?\s*(?:k|m|million)?`;
const PERCENT = String.raw`\d[\d,.]*\s*%`;

/**
 * Each rule names a slot and what may legally fill it. `bad` matching means the
 * slot holds the wrong kind of quantity — a category error, not a debatable figure.
 */
const UNIT_RULES = [
  {
    id: 'money-as-duration',
    why: 'a turnaround, timeline or window is a duration, not an amount',
    bad: new RegExp(`${MONEY}\\s*(?:day|days|week|weeks|month|months)?\\s*(?:turnaround|timeline|window|lead time)\\b`, 'i'),
  },
  {
    id: 'money-as-rate',
    why: 'a withholding, tax or interest rate is a percentage, not an amount',
    bad: new RegExp(`${MONEY}\\s*(?:isr|iva|vat)?\\s*(?:withholding|tax rate|interest rate)\\b`, 'i'),
  },
  {
    id: 'money-as-yield',
    why: 'a yield is a percentage, not an amount',
    bad: new RegExp(`${MONEY}\\s*(?:net|gross)?\\s*yield(?!\\s*(?:band\\s*of|band:))`, 'i'),
  },
  {
    id: 'yield-row-holds-price',
    why: 'a table row labelled as a yield band is holding a purchase price',
    bad: new RegExp(`\\|\\s*(?:net |gross )?yield[^|]*\\|\\s*${MONEY}\\s*\\|`, 'i'),
  },
  {
    id: 'percent-as-price',
    why: 'an entry ticket, purchase price or carry amount is money, not a percentage',
    bad: new RegExp(`${PERCENT}\\s*(?:entry ticket|purchase price|entry price|carry proof)\\b`, 'i'),
  },
  {
    id: 'percent-as-duration',
    why: 'a turnaround is a duration, not a percentage',
    bad: new RegExp(`${PERCENT}\\s*turnaround\\b`, 'i'),
  },
];

/* ------------------------------------------------------------------- run */

const files = readAll();

let scope = files;
if (changedOnly) {
  let changed = [];
  try {
    const out = execSync('git diff --name-only HEAD -- src/content && git diff --cached --name-only -- src/content', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    changed = out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    changed = [];
  }
  const set = new Set(changed);
  scope = files.filter((f) => set.has(f.rel));
  if (scope.length === 0) {
    console.log('Corpus originality: no changed MDX in scope — nothing to check.');
    process.exit(0);
  }
}

// Shape index is always built from the whole corpus: a sentence is only a duplicate
// relative to everything else that is published.
const shapeFiles = new Map();
for (const f of files) {
  for (const s of sentences(prose(f.body))) {
    const k = shape(s);
    if (k.split(' ').length < MIN_WORDS) continue;
    if (!shapeFiles.has(k)) shapeFiles.set(k, new Set());
    shapeFiles.get(k).add(`${f.collection}/${f.slug}`);
  }
}

const dupes = [];
const units = [];

for (const f of scope) {
  const id = `${f.collection}/${f.slug}`;
  const seenShape = new Set();
  for (const s of sentences(prose(f.body))) {
    const k = shape(s);
    if (k.split(' ').length < MIN_WORDS) continue;
    const others = (shapeFiles.get(k) ?? new Set()).size - 1;
    if (others >= DUP_FILE_LIMIT && !seenShape.has(k)) {
      seenShape.add(k);
      dupes.push({ file: id, rel: f.rel, others, sample: s.replace(/\s+/g, ' ').slice(0, 150) });
    }
  }
  for (const rule of UNIT_RULES) {
    const hit = f.body.match(rule.bad);
    if (hit) {
      units.push({
        file: id,
        rel: f.rel,
        rule: rule.id,
        why: rule.why,
        sample: hit[0].replace(/\s+/g, ' ').slice(0, 110),
      });
    }
  }
}

const dupFiles = new Set(dupes.map((d) => d.file)).size;
const unitFiles = new Set(units.map((u) => u.file)).size;

if (asJson) {
  console.log(JSON.stringify({ scanned: scope.length, dupes, units }, null, 2));
} else {
  console.log('\n=== CORPUS ORIGINALITY + UNIT COHERENCE ===');
  console.log(`Scanned: ${scope.length} MDX${changedOnly ? ' (changed only)' : ''} | corpus index: ${files.length}\n`);

  console.log(`[P0] duplicate-sentence — ${dupes.length} in ${dupFiles} files`);
  for (const d of dupes.slice(0, limitArg)) {
    console.log(`      ${d.file}  (also in ${d.others} files)\n        "${d.sample}"`);
  }
  if (dupes.length > limitArg) console.log(`      ... and ${dupes.length - limitArg} more`);

  console.log(`\n[P0] unit-coherence — ${units.length} in ${unitFiles} files`);
  for (const u of units.slice(0, limitArg)) {
    console.log(`      ${u.file}  ${u.rule}: "${u.sample}"\n        ${u.why}`);
  }
  if (units.length > limitArg) console.log(`      ... and ${units.length - limitArg} more`);

  console.log(
    dupes.length + units.length === 0
      ? '\n✅ PASS — no duplicated boilerplate, no unit errors.\n'
      : `\n❌ ${dupes.length + units.length} issues across ${new Set([...dupes, ...units].map((x) => x.file)).size} files.\n`,
  );
}

if (failOnIssues && dupes.length + units.length > 0) process.exit(1);
