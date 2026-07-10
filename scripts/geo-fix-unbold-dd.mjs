#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
let n = 0;

for (const coll of readdirSync(CONTENT)) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const abs = join(dir, f);
    let raw = readFileSync(abs, 'utf8');
    const next = raw.replace(/- \*\*([^*]+):\*\*/g, '- $1:');
    if (next !== raw) {
      writeFileSync(abs, next, 'utf8');
      n += 1;
    }
  }
}
console.log(`Unbold DD bullets in ${n} files`);
