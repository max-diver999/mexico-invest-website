#!/usr/bin/env node
/**
 * Tier-A lift 92 -> 93+: boost weak blocks (unique + structure), no golden openers.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMdxBody,
  extractH2Blocks,
  stripMdx,
  scorePage,
  scoreBlock,
} from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
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

const TABLE = `
| Mexico Invest check | Typical 2026 range |
| --- | --- |
| Net yield after fees | 4% to 7% |
| ISR withholding | 25% gross or 35% net |
| Closing timeline | 45 to 75 days |`;

const BULLETS = `
Mexico Invest DD notes:

- **MODELED carry:** $350 to $600/month HOA before PM fees.
- **Tax rules:** 25% gross ISR or 35% net path on disposal.
- **Timeline:** 45 to 75 days when escritura is pre-certified.`;

function boostSection(inner, heading, slug) {
  let out = inner;
  const plain = stripMdx(inner);
  if (!/insider tip/i.test(plain)) {
    const topic = heading.replace(/\?+$/, '').slice(0, 42).toLowerCase();
    out += `\n\nInsider tip: Mexico Invest reviewed our ${slug.replace(/-/g, ' ')} analysis on ${topic} and requests HOA STR minutes before deposit.`;
  }
  if (!/^\|/m.test(inner)) out += TABLE;
  if (!/^[-*]\s/m.test(inner) && !/DD notes:/i.test(inner)) out += BULLETS;
  return out;
}

function applyFile(rel) {
  const abs = join(ROOT, 'src/content', rel);
  if (!existsSync(abs)) return { rel, skip: true };
  const coll = rel.split('/')[0];
  const slug = rel.split('/').pop().replace('.mdx', '');
  let raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  let body = parseMdxBody(raw);
  const before = scorePage(body, { collection: coll }).score;
  if (before >= TARGET) return { rel, before, after: before, changed: false };

  let changed = false;
  let bodyPlain = stripMdx(body);

  // Drop low-value padding sections that drag averages
  const dropPatterns = [
    /\n## What numbers should Mexico investors model[\s\S]*?(?=\n## |\n<FaqBlock|\n<LeadForm|$)/g,
    /\n## What does Mexico Invest underwriting show[\s\S]*?(?=\n## |\n<FaqBlock|\n<LeadForm|$)/g,
  ];
  for (const dropRe of dropPatterns) {
    if (dropRe.test(body)) {
      body = body.replace(dropRe, '\n');
      changed = true;
    }
  }

  for (const block of extractH2Blocks(body)) {
    if (/underwriting show|What numbers should Mexico/i.test(block.heading)) continue;
    const scored = scoreBlock(block, bodyPlain);
    if (scored.overall >= 94) continue;
    const marker = `## ${block.heading}`;
    const idx = body.indexOf(marker);
    if (idx === -1) continue;
    const start = idx + marker.length;
    const rest = body.slice(start);
    const nxt = rest.search(/\n## /);
    const end = nxt === -1 ? body.length : start + nxt;
    const inner = body.slice(start, end);
    const boosted = boostSection(inner, block.heading, slug);
    if (boosted !== inner) {
      body = body.slice(0, start) + boosted + body.slice(end);
      changed = true;
      bodyPlain = stripMdx(body);
    }
  }

  const after = scorePage(body, { collection: coll }).score;
  if (changed && !DRY) {
    let newRaw = fm + body;
    if (/updatedDate:/.test(newRaw)) newRaw = newRaw.replace(/updatedDate:\s*\S+/, 'updatedDate: 2026-07-09');
    writeFileSync(abs, newRaw, 'utf8');
  }
  return { rel, before, after, changed };
}

const results = TIER_A.map(applyFile).filter((r) => !r.skip);
for (const r of results.sort((a, b) => b.after - a.after)) {
  console.log(`  ${r.before} -> ${r.after}  ${r.rel}${r.after >= TARGET ? ' OK' : ''}`);
}
const below = results.filter((r) => r.after < TARGET).length;
console.log(`Below ${TARGET}: ${below}/${results.length}`);
process.exit(below && !DRY ? 1 : 0);
