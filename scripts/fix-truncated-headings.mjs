#!/usr/bin/env node
/**
 * Repair headings the generator cut mid-word.
 *
 * The generator capped heading text at a fixed character count and cut without
 * looking for a word boundary, leaving headings like:
 *
 *   ## Rental program structures and personal use limitat
 *   ## Property manager benchmarking by monthly performan
 *   ## Montage residences Punta Mita: flagship developmen
 *
 * A truncation is identified structurally rather than by length: the heading's
 * last word is rare in the corpus AND some common corpus word starts with it.
 * "limitat" is a prefix of "limitations"; "guardrails" is a prefix of nothing,
 * so a rare-but-real word is left alone.
 *
 * The completion is the most frequent corpus word that extends the fragment.
 * Where several are plausible the script reports rather than guesses.
 *
 * Usage: node scripts/fix-truncated-headings.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];
const DRY = process.argv.includes('--dry');

/** Corpus vocabulary, so completions come from wording the site already uses. */
const vocab = new Map();
const files = [];
for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    files.push({ abs, rel: `${collection}/${file}`, raw });
    for (const w of raw.toLowerCase().match(/[a-zà-ÿ]+/g) ?? []) {
      vocab.set(w, (vocab.get(w) ?? 0) + 1);
    }
  }
}

/** Words that extend `frag`, most frequent first. */
function completions(frag) {
  const out = [];
  for (const [w, n] of vocab) {
    if (w.length > frag.length && w.startsWith(frag) && n >= 5) out.push([w, n]);
  }
  return out.sort((a, b) => b[1] - a[1]);
}

/** Preserve the fragment's capitalisation when extending it. */
function matchCase(frag, full) {
  if (frag === frag.toUpperCase() && frag.length > 1) return full.toUpperCase();
  if (frag[0] === frag[0].toUpperCase()) return full[0].toUpperCase() + full.slice(1);
  return full;
}

let changed = 0;
let fixed = 0;
const ambiguous = [];

for (const f of files) {
  let out = f.raw;
  let touched = false;
  for (const m of f.raw.matchAll(/^(#{2,3}) (.+)$/gm)) {
    const heading = m[2].trim();
    const tail = heading.match(/([A-Za-zÀ-ÿ]+)$/);
    if (!tail) continue;
    const frag = tail[1];
    if (frag.length < 3) continue;
    if ((vocab.get(frag.toLowerCase()) ?? 0) > 2) continue;
    const cands = completions(frag.toLowerCase());
    if (!cands.length) continue;
    // Two very different completions of similar frequency is a guess, not a repair.
    if (cands.length > 1 && cands[1][1] > cands[0][1] * 0.6 && cands[1][0] !== cands[0][0].replace(/s$/, '')) {
      ambiguous.push(`${f.rel}: "${heading}" → ${cands.slice(0, 3).map(([w, n]) => `${w}(${n})`).join(' / ')}`);
      continue;
    }
    const repaired = heading.slice(0, heading.length - frag.length) + matchCase(frag, cands[0][0]);
    out = out.replace(`${m[1]} ${heading}`, `${m[1]} ${repaired}`);
    fixed++;
    touched = true;
  }
  if (!touched) continue;
  changed++;
  if (!DRY) fs.writeFileSync(f.abs, out);
}

console.log(`\n=== TRUNCATED HEADINGS ${DRY ? '(dry run)' : ''} ===`);
console.log(`Files changed: ${changed} | headings completed: ${fixed}`);
if (ambiguous.length) {
  console.log(`\nAmbiguous, left for a human: ${ambiguous.length}`);
  for (const a of ambiguous) console.log('  ' + a);
}
console.log('');
