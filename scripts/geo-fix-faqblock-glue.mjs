#!/usr/bin/env node
/** Fix MDX where table row was glued to <FaqBlock */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
let fixed = 0;

for (const coll of readdirSync(CONTENT)) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const abs = join(dir, f);
    let raw = readFileSync(abs, 'utf8');
    if (!/\|<FaqBlock/.test(raw)) continue;
    const next = raw.replace(/\|<FaqBlock/g, '|\n\n<FaqBlock');
    if (next !== raw) {
      writeFileSync(abs, next, 'utf8');
      fixed += 1;
      console.log('fixed', coll + '/' + f);
    }
  }
}
console.log(`Fixed ${fixed} files`);
