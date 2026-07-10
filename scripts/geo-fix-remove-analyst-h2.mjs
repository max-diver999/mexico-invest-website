#!/usr/bin/env node
/** Remove accidental analyst-data H2 blocks added by earlier tier-A pass */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');

function stripAnalyst(body) {
  const re = /\n## What does Mexico Invest analyst data show[\s\S]*?(?=\n## |\n<FaqBlock)/;
  return body.replace(re, '\n');
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
    if (!/analyst data show/i.test(body)) continue;
    const next = stripAnalyst(body);
    if (next === body) continue;
    if (!DRY) writeFileSync(abs, fm + next, 'utf8');
    n += 1;
    console.log('removed', coll + '/' + f);
  }
}
console.log(`${DRY ? '[dry-run] ' : ''}Cleaned ${n} files`);
