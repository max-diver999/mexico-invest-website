#!/usr/bin/env node
/** Intensive pass2+pass4 on tier-A URLs only */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody, scorePage } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = 93;

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

function run(cmd, args) {
  spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
}

for (let i = 0; i < 3; i += 1) {
  run('node', ['scripts/geo-fix-corpus-90-pass2.mjs', '--min-score', '93']);
  run('node', ['scripts/geo-fix-corpus-90-pass4.mjs']);
}

const results = TIER_A.map((rel) => {
  const abs = join(ROOT, 'src/content', rel);
  const coll = rel.split('/')[0];
  const body = parseMdxBody(readFileSync(abs, 'utf8'));
  const score = scorePage(body, { collection: coll }).score;
  return { rel, score };
});

for (const r of results.sort((a, b) => b.score - a.score)) {
  console.log(`${r.score} ${r.rel}${r.score >= TARGET ? ' OK' : ''}`);
}
const below = results.filter((r) => r.score < TARGET).length;
console.log(`Tier-A below ${TARGET}: ${below}/${results.length}, max ${Math.max(...results.map((r) => r.score))}`);
process.exit(below ? 1 : 0);
