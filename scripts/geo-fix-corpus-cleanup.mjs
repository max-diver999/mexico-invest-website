#!/usr/bin/env node
/**
 * Remove duplicate GEO boilerplate injected by batch passes.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');

function cleanup(body) {
  let out = body;

  // Remove generic field-notes H2 blocks
  out = out.replace(
    /\n## Mexico Invest field notes on[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n\*|$)/g,
    '\n',
  );

  // Dedupe repeated padding sentence
  const pad = 'Mexico Invest buyer desk reviewed Q2 2026 Riviera Maya and Los Cabos files before buyers waived contingencies.';
  while (out.split(pad).length > 3) {
    out = out.replace(pad, '');
  }

  // Remove junk insider tips from auto-pass3
  out = out.replace(
    /\n+Insider tip: Mexico Invest flags [^\n]+carry lines on[^\n]+\./g,
    '',
  );
  out = out.replace(
    /\n+Insider tip: On what should buyers verify[^\n]+\./g,
    '',
  );
  out = out.replace(
    /\n+Insider tip: Mexico Invest reviewed our analysis on[^\n]+\./g,
    '',
  );

  // Keep one DD notes block per section: collapse duplicate adjacent blocks
  out = out.replace(
    /(Mexico Invest DD notes:\n\n[\s\S]*?)(\n+Mexico Invest DD notes:\n\n[\s\S]*?)(?=\n## |\n<FaqBlock|$)/g,
    '$1',
  );

  // Remove duplicate generic tables in same section
  const table =
    '| Mexico Invest check | Typical 2026 range |\n| --- | --- |\n| Net yield after fees | 4% to 7% |\n| ISR withholding | 25% gross or 35% net |\n| Closing timeline | 45 to 75 days |';
  while (out.split(table).length > 3) {
    out = out.replace(table, '');
  }

  // Fix mangled insider-tip H2
  out = out.replace(
    /## What should buyers verify on insider tip:[^\n]+\n\n[\s\S]*?(?=\n## |\n<FaqBlock|$)/,
    '',
  );

  // Collapse 3+ blank lines
  out = out.replace(/\n{4,}/g, '\n\n\n');

  return out.trim() + '\n';
}

let n = 0;
for (const coll of readdirSync(CONTENT)) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const abs = join(dir, f);
    const raw = readFileSync(abs, 'utf8');
    const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
    const body = parseMdxBody(raw);
    const cleaned = cleanup(body);
    if (cleaned !== body + (body.endsWith('\n') ? '' : '\n')) {
      if (!DRY) writeFileSync(abs, fm + cleaned, 'utf8');
      n += 1;
    }
  }
}
console.log(`${DRY ? '[dry-run] ' : ''}Cleaned ${n} files`);
