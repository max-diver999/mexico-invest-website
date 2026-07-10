#!/usr/bin/env node
/**
 * Safe GEO pipeline: pass1 → pass2 (prepend-only) → pass3, loop until corpus ≥90.
 * Then tier-A careful lift to 93+.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody, scorePage } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const MAX_ROUNDS = Number(process.env.GEO_ROUNDS || 12);
const CORPUS_TARGET = 90;
const TIER_A_TARGET = 93;

const TIER_A = [
  'guides/earthquake-risk-mexico-property.mdx',
  'guides/repatriate-sale-proceeds-mexico.mdx',
  'guides/branded-residences-mexico-guide.mdx',
  'guides/vat-mexico-property-rental.mdx',
  'guides/sat-rental-registration-mexico.mdx',
  'guides/liability-insurance-str-mexico.mdx',
  'guides/hurricane-insurance-bcs.mdx',
  'guides/can-foreigners-buy-property-mexico.mdx',
  'guides/mexico-property-investment-guide.mdx',
  'guides/mexico-rental-yield-guide.mdx',
  'guides/fideicomiso-mexico-explained.mdx',
  'guides/best-areas-invest-mexico-2026.mdx',
  'compare/mexico-vs-portugal-property-investment.mdx',
  'compare/playa-del-carmen-vs-tulum-investment.mdx',
  'guides/cfdi-cost-basis-mexico.mdx',
  'guides/cross-border-lender-list.mdx',
  'areas/tulum.mdx',
  'areas/playa-del-carmen.mdx',
  'projects/chileno-bay-residences.mdx',
  'projects/four-seasons-costa-palmas.mdx',
];

function listMdx() {
  const files = [];
  for (const coll of readdirSync(CONTENT)) {
    const dir = join(CONTENT, coll);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
      files.push(join(dir, f));
    }
  }
  return files;
}

function corpusStats() {
  const scores = listMdx().map((abs) => {
    const body = parseMdxBody(readFileSync(abs, 'utf8'));
    const coll = abs.split('/content/')[1].split('/')[0];
    return { abs, score: scorePage(body, { collection: coll }).score };
  });
  const below = scores.filter((s) => s.score < CORPUS_TARGET).length;
  const avg = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
  const min = Math.min(...scores.map((s) => s.score));
  const max = Math.max(...scores.map((s) => s.score));
  return { total: scores.length, below, avg, min, max, scores };
}

function tierAStats() {
  const out = [];
  for (const rel of TIER_A) {
    const abs = join(CONTENT, rel);
    const body = parseMdxBody(readFileSync(abs, 'utf8'));
    const coll = rel.split('/')[0];
    const score = scorePage(body, { collection: coll }).score;
    out.push({ rel, score });
  }
  const below = out.filter((x) => x.score < TIER_A_TARGET).length;
  return { below, out, min: Math.min(...out.map((x) => x.score)) };
}

function run(script) {
  console.log(`\n>>> node scripts/${script}`);
  const r = spawnSync('node', [`scripts/${script}`], { cwd: ROOT, stdio: 'inherit' });
  return r.status ?? 1;
}

let stats = corpusStats();
console.log(`Start: ${stats.total} files, avg ${stats.avg}, min ${stats.min}, below ${CORPUS_TARGET}: ${stats.below}`);

for (let round = 1; round <= MAX_ROUNDS && stats.below > 0; round += 1) {
  console.log(`\n=== Round ${round}/${MAX_ROUNDS} ===`);
  run('geo-fix-corpus-90.mjs');
  run('geo-fix-corpus-90-pass2.mjs');
  run('geo-fix-corpus-90-pass3.mjs');
  run('geo-fix-corpus-90-pass4.mjs');
  stats = corpusStats();
  console.log(`After round ${round}: avg ${stats.avg}, min ${stats.min}, max ${stats.max}, below ${CORPUS_TARGET}: ${stats.below}`);
  if (stats.below === 0) break;
}

if (stats.below > 0) {
  console.error(`\nFAIL: still ${stats.below} files below ${CORPUS_TARGET}`);
  const worst = stats.scores.filter((s) => s.score < CORPUS_TARGET).sort((a, b) => a.score - b.score).slice(0, 15);
  for (const w of worst) console.error(`  ${w.score}  ${w.abs.replace(ROOT + '/', '')}`);
  process.exit(1);
}

console.log('\n>>> tier-A careful pass');
run('geo-fix-careful-tier-a.mjs');

let tier = tierAStats();
if (tier.below > 0) {
  for (let round = 1; round <= 4 && tier.below > 0; round += 1) {
    run('geo-fix-corpus-90-pass2.mjs');
    run('geo-fix-careful-tier-a.mjs');
    tier = tierAStats();
    console.log(`Tier-A round ${round}: below ${TIER_A_TARGET}: ${tier.below}, min ${tier.min}`);
  }
}

if (tier.below > 0) {
  console.error(`\nFAIL tier-A: ${tier.below} below ${TIER_A_TARGET}`);
  for (const t of tier.out.filter((x) => x.score < TIER_A_TARGET)) console.error(`  ${t.score}  ${t.rel}`);
  process.exit(1);
}

console.log(`\nOK: corpus ${stats.total}/${stats.total} ≥${CORPUS_TARGET}, tier-A 20/20 ≥${TIER_A_TARGET}, avg ${stats.avg}`);
process.exit(0);
