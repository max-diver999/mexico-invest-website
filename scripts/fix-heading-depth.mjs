#!/usr/bin/env node
/**
 * Demote over-fragmented H2s to H3.
 *
 * The generator emitted a new H2 for almost every paragraph, so pages ended up with
 * 30 to 45 top-level sections over 2,500 words — around 60 words per "section".
 * That is not an outline, it is a list of paragraphs with headings on them, and it
 * splits one search intent across dozens of competing anchors.
 *
 * A heading whose section is shorter than MIN_H2_WORDS is a subsection: it becomes an
 * H3 under the H2 above it. Headings are never deleted and no prose moves — the
 * document keeps every word and gains a real hierarchy.
 *
 * Only runs on files that exceed MAX_H2, so well-structured pages are left alone.
 *
 * Usage: node scripts/fix-heading-depth.mjs [--dry] [--max=22] [--min-words=80]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const MAX_H2 = Number((argv.find((a) => a.startsWith('--max=')) ?? '').split('=')[1]) || 22;
const MIN_H2_WORDS = Number((argv.find((a) => a.startsWith('--min-words=')) ?? '').split('=')[1]) || 80;

function words(text) {
  return text.replace(/^\|.*$/gm, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

let filesChanged = 0;
let demoted = 0;
const report = [];

for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const m = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) continue;
    const [, frontmatter, body] = m;

    const lines = body.split('\n');
    const h2Index = lines
      .map((line, i) => (/^## /.test(line) ? i : -1))
      .filter((i) => i >= 0);
    if (h2Index.length <= MAX_H2) continue;

    // Section body of each H2 runs to the next H2 (or the end of the document).
    const sizes = h2Index.map((start, n) => {
      const end = n + 1 < h2Index.length ? h2Index[n + 1] : lines.length;
      return words(lines.slice(start + 1, end).join('\n'));
    });

    let remaining = h2Index.length;
    let localDemoted = 0;
    // Shortest sections first, so the deepest fragments go before anything borderline.
    const order = sizes
      .map((size, n) => ({ size, n }))
      .sort((a, b) => a.size - b.size);

    for (const { size, n } of order) {
      if (remaining <= MAX_H2) break;
      if (size >= MIN_H2_WORDS) break;
      // The first heading in the document has no H2 above it to nest under.
      if (n === 0) continue;
      lines[h2Index[n]] = lines[h2Index[n]].replace(/^## /, '### ');
      remaining--;
      localDemoted++;
    }

    if (!localDemoted) continue;
    filesChanged++;
    demoted += localDemoted;
    report.push(`${collection}/${file.replace(/\.mdx?$/, '')}: ${h2Index.length} -> ${remaining} H2 (${localDemoted} demoted)`);
    if (!DRY) fs.writeFileSync(abs, frontmatter + lines.join('\n'));
  }
}

console.log(`\n=== HEADING DEPTH ${DRY ? '(dry run)' : ''} ===`);
console.log(`Threshold: more than ${MAX_H2} H2s, sections under ${MIN_H2_WORDS} words demoted to H3.`);
console.log(`Files changed: ${filesChanged} | headings demoted: ${demoted}\n`);
for (const line of report.slice(0, 40)) console.log('  ' + line);
if (report.length > 40) console.log(`  ... and ${report.length - 40} more`);
console.log('');
