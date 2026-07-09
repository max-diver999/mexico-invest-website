#!/usr/bin/env node
/**
 * Surgical cleanup: remove pass2/pass3 boilerplate that corrupts content and drags scores.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');

const GOLDEN_OPENER_RE =
  /^Mexico investors reviewing[\s\S]*?typically require[\s\S]*?(?:\n\n|$)/gm;

function cleanup(body) {
  let out = body;

  // Remove auto golden openers (often truncated or wrong stats)
  out = out.replace(GOLDEN_OPENER_RE, '');

  // Remove generic padding H2 blocks entirely
  out = out.replace(
    /\n## What numbers should Mexico investors model on[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n\*|$)/g,
    '\n',
  );
  out = out.replace(
    /\n## Mexico Invest field notes on[\s\S]*?(?=\n## |\n<FaqBlock|\n---\n\*|$)/g,
    '\n',
  );

  // Remove duplicate DD notes blocks (keep first per section chunk)
  out = out.replace(
    /(Mexico Invest DD notes(?: for this section)?:\n\n[\s\S]*?)(\n+Mexico Invest DD notes:\n\n[\s\S]*?)(?=\n## |\n<FaqBlock|$)/g,
    '$1',
  );

  // Remove junk insider tips from pass2
  out = out.replace(
    /\n+Insider tip: On what should buyers verify[^\n]+\./g,
    '',
  );
  out = out.replace(
    /\n+Insider tip: Mexico Invest flags [^\n]+carry lines[^\n]+\./g,
    '',
  );

  // Remove duplicate generic tables
  const genericTable =
    '| Mexico Invest check | Typical 2026 range |\n| --- | --- |\n| Net yield after fees | 4% to 7% |\n| ISR withholding | 25% gross or 35% net |\n| Closing timeline | 45 to 75 days |';
  while ((out.match(new RegExp(genericTable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length > 1) {
    out = out.replace(genericTable, '');
  }

  // Fix mangled H2 from pass3
  out = out.replace(/## What should buyers verify on insider tip:[^\n]+\n\n[\s\S]*?(?=\n## |\n<FaqBlock|$)/, '');

  // Restore sensible heading for related links section
  out = out.replace(
    /## What should buyers verify on related insurance and safety guides\?/,
    '## Related insurance and safety guides',
  );

  // Collapse excessive blank lines
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
console.log(`${DRY ? '[dry-run] ' : ''}Surgical cleanup: ${n} files`);
