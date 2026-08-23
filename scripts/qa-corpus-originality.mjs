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
 * Three checks, each of which would have caught that at generation time:
 *
 *   duplicate-sentence  a >=8-word sentence whose number-normalised shape also
 *                       appears in >= DUP_FILE_LIMIT other files
 *   templated-sentence  the same sentence with the place name swapped. Normalising
 *                       numbers alone does not catch "Eight checks settle a Loreto
 *                       purchase" against "Eight checks settle a La Paz purchase";
 *                       the Aug 2026 wave shipped 44 of these before a hand audit
 *                       found them. This check masks proper nouns as well, and keys
 *                       on content words so "a X purchase" and "an Y purchase" match.
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
/**
 * Sentences shorter than this are furniture, not substance: a one-line disclaimer
 * or a "verify with your notario" reminder is supposed to read the same everywhere.
 * The generated padding this gate exists to catch ran 15-40 words.
 */
const MIN_WORDS = 12;

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
    .replace(/^#{1,6} .*$/gm, ' ')
    // Site furniture, not prose: italic disclaimers and link rails legitimately
    // repeat across pages the way a footer does.
    .replace(/^\s*\*[^*\n]{20,}\*\s*$/gm, ' ')
    .replace(/^[^\n]*(?:\]\([^)]*\)[^\n]*){2,}$/gm, ' ');
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

/* ----------------------------------------------------- templated sentences */

/**
 * A shape appearing in this many files at all (not "other" files) is a template.
 * Set above the duplicate-sentence limit because masking proper nouns is a blunter
 * instrument: a legal fact restated in three market guides is fine, the same
 * sentence across nine with only the town swapped is not.
 */
const TEMPLATE_FILE_LIMIT = 4;

/**
 * Site furniture that is supposed to read identically everywhere, the way a footer
 * does. Matched against the masked skeleton, so add the sentence's own wording.
 */
const TEMPLATE_ALLOW = [
  /^browse off plan resale listings we cover corridor$/,
  /^when visiting before offer block two full days minimum$/,
  /^pricing fees tax treatment move set per transaction/,
];

/**
 * Collapse numbers AND proper nouns, then drop the proper-noun slots entirely, so
 * two sentences differing only by place name reduce to the same skeleton.
 */
function skeleton(sentence) {
  return sentence
    .replace(/[\d][\d.,%$–—-]*/g, '#')
    .replace(/\bMXN\b|\bUSD\b|\bUS\$/g, '$')
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z#$]/g, ''))
    .filter(Boolean)
    .map((w) => (/^[A-Z]/.test(w) ? '' : w.toLowerCase()))
    .filter(Boolean)
    .join(' ');
}

/** Stop words carry no signal; a skeleton needs real content words to be a template. */
const STOP = new Set(
  'the a an and or of to in on for at is are that which it this with as by from be not but'.split(' '),
);

/**
 * The key is the content-word sequence, not the full skeleton. Keeping stop words
 * lets "a La Paz purchase" and "an Oaxaca City purchase" hash differently, which is
 * exactly the variation a place-name swap produces — the first version of this check
 * missed a live 4-file template for that reason.
 */
function templateKey(sentence) {
  const content = skeleton(sentence)
    .split(' ')
    .filter((w) => w && !STOP.has(w) && w !== '#' && w !== '$');
  return content.length >= 5 ? content.join(' ') : null;
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
    why: 'a turnaround is a duration; a currency amount cannot be one',
    // "$326,000 turnaround". Adjacent only — "$22,000 in turnaround costs" is fine.
    bad: new RegExp(`${MONEY}\\s+(?:typical\\s+|average\\s+|common\\s+)?(?:notario\\s+)?turnaround\\b`, 'i'),
  },
  {
    id: 'percent-as-duration',
    why: 'a turnaround is a duration; a percentage cannot be one',
    bad: new RegExp(`${PERCENT}\\s+(?:typical\\s+|average\\s+|common\\s+)?(?:notario\\s+)?turnaround\\b`, 'i'),
  },
  {
    id: 'money-as-rate',
    why: 'a withholding rate is a percentage; this slot holds a currency amount',
    // Anchored on the generator's phrasing. "$21,250 of ISR withholding" is a real
    // amount and must not be flagged, so the noun that follows is required.
    bad: new RegExp(`${MONEY}\\s+(?:isr\\s+|iva\\s+)?withholding\\s+awareness\\b`, 'i'),
  },
  {
    id: 'money-as-yield',
    why: 'a yield is a percentage; this slot holds a currency amount',
    // "$28,000 net yield modeling" / "$265,000 net yield band". Excludes the common
    // and correct "condos from $400K yield 8-10% gross", where yield is a verb.
    bad: new RegExp(`${MONEY}\\s+(?:net|gross)\\s+yield\\s+(?:modeling|modelling|band)\\b`, 'i'),
  },
  {
    id: 'yield-row-holds-price',
    why: 'a table row labelled as a yield band is holding a purchase price',
    bad: new RegExp(`\\|\\s*(?:net |gross )?yield band[^|]*\\|\\s*${MONEY}\\s*\\|`, 'i'),
  },
  {
    id: 'percent-as-price',
    why: 'an entry ticket or carry amount is money, not a percentage',
    // "10% purchase price discount" is correct English and is not matched.
    bad: new RegExp(`${PERCENT}\\s+(?:entry tickets?|carry proof)\\b`, 'i'),
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

const templateFiles = new Map();
for (const f of files) {
  const id = `${f.collection}/${f.slug}`;
  for (const s of sentences(prose(f.body))) {
    const k = templateKey(s);
    if (!k || TEMPLATE_ALLOW.some((re) => re.test(k))) continue;
    if (!templateFiles.has(k)) templateFiles.set(k, new Map());
    if (!templateFiles.get(k).has(id)) templateFiles.get(k).set(id, s);
  }
}

const dupes = [];
const templated = [];
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
  const seenTemplate = new Set();
  for (const s of sentences(prose(f.body))) {
    const k = templateKey(s);
    if (!k || seenTemplate.has(k) || TEMPLATE_ALLOW.some((re) => re.test(k))) continue;
    const hits = templateFiles.get(k);
    if (!hits || hits.size < TEMPLATE_FILE_LIMIT) continue;
    seenTemplate.add(k);
    templated.push({
      file: id,
      rel: f.rel,
      count: hits.size,
      sample: s.replace(/\s+/g, ' ').slice(0, 130),
      also: [...hits.keys()].filter((x) => x !== id).slice(0, 3),
    });
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
const templateFileCount = new Set(templated.map((t) => t.file)).size;
const unitFiles = new Set(units.map((u) => u.file)).size;

if (asJson) {
  console.log(JSON.stringify({ scanned: scope.length, dupes, templated, units }, null, 2));
} else {
  console.log('\n=== CORPUS ORIGINALITY + UNIT COHERENCE ===');
  console.log(`Scanned: ${scope.length} MDX${changedOnly ? ' (changed only)' : ''} | corpus index: ${files.length}\n`);

  console.log(`[P0] duplicate-sentence — ${dupes.length} in ${dupFiles} files`);
  for (const d of dupes.slice(0, limitArg)) {
    console.log(`      ${d.file}  (also in ${d.others} files)\n        "${d.sample}"`);
  }
  if (dupes.length > limitArg) console.log(`      ... and ${dupes.length - limitArg} more`);

  console.log(`\n[P0] templated-sentence — ${templated.length} in ${templateFileCount} files`);
  for (const t of templated.slice(0, limitArg)) {
    console.log(`      ${t.file}  (same shape in ${t.count} files: ${t.also.join(', ')}…)\n        "${t.sample}"`);
  }
  if (templated.length > limitArg) console.log(`      ... and ${templated.length - limitArg} more`);

  console.log(`\n[P0] unit-coherence — ${units.length} in ${unitFiles} files`);
  for (const u of units.slice(0, limitArg)) {
    console.log(`      ${u.file}  ${u.rule}: "${u.sample}"\n        ${u.why}`);
  }
  if (units.length > limitArg) console.log(`      ... and ${units.length - limitArg} more`);

  const total = dupes.length + templated.length + units.length;
  console.log(
    total === 0
      ? '\n✅ PASS — no duplicated boilerplate, no templated sentences, no unit errors.\n'
      : `\n❌ ${total} issues across ${new Set([...dupes, ...templated, ...units].map((x) => x.file)).size} files.\n`,
  );
}

if (failOnIssues && dupes.length + templated.length + units.length > 0) process.exit(1);
