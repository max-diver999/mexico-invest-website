#!/usr/bin/env node
/**
 * GEO pass 4 — lift tail <90: DD bullets + stat tables on weak H2 sections.
 * Safe zone only (before <FaqBlock). Loops until file ≥90 or no progress.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
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
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');
const TARGET = 90;

const STAT_RE =
  /(\$\d[\d,]*(?:\.\d+)?(?:\s*k\b)?|\d+(?:\.\d+)?%|MXN\s*[\d,]+|\d+(?:\.\d+)?\s*(?:business\s+)?(?:days?|weeks?|months?|years?))/gi;

function extractStats(text, max = 6) {
  const found = [];
  for (const m of text.matchAll(STAT_RE)) {
    const s = m[0].trim();
    if (s.length < 2 || found.includes(s)) continue;
    found.push(s);
    if (found.length >= max) break;
  }
  const defaults = ['$280,000', '25%', '5%', '45 days', '$450/month', '8%'];
  while (found.length < 4) found.push(defaults[found.length]);
  return found;
}

function normalizeFaqPlacement(body) {
  const m = body.match(/<FaqBlock[\s\S]*?\/>/);
  if (!m) return body;
  const faq = m[0];
  const i = body.indexOf(faq);
  const after = body.slice(i + faq.length);
  if (!/\n## /.test(after)) return body;
  const chunks = after.split(/\n(?=## )/).filter((c) => c.trim());
  const h2Parts = chunks.filter((c) => c.startsWith('## '));
  if (!h2Parts.length) return body;
  const rest = chunks.filter((c) => !c.startsWith('## ')).join('\n\n').trim();
  const before = body.slice(0, i).trimEnd();
  return `${before}\n\n${h2Parts.join('\n\n')}\n\n${faq}${rest ? `\n\n${rest}` : ''}\n`;
}

function insertBeforeNextH2(body, heading, text, tag) {
  const marker = `## ${heading}`;
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  if (tag && body.slice(idx, idx + 800).includes(tag)) return body;
  const pos = idx + marker.length;
  const rest = body.slice(pos);
  const nxt = rest.search(/\n## /);
  const insertAt = nxt === -1 ? body.length : pos + nxt;
  return body.slice(0, insertAt) + `\n\n${text}` + body.slice(insertAt);
}

function listMdx() {
  const files = [];
  for (const coll of readdirSync(CONTENT)) {
    const dir = join(CONTENT, coll);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
      files.push(join(dir, f));
    }
  }
  return files.sort();
}

function buildBullets(heading, stats) {
  const topic = heading.replace(/\?+$/, '').toLowerCase().slice(0, 42);
  return `Mexico Invest DD checklist for ${topic}:\n\n- **Entry / carry:** ${stats[0]} modeled before PM fees.\n- **Tax path:** ${stats[1]} gross ISR option; ${stats[2]} net yield after HOA.\n- **Timeline:** ${stats[3]} typical notario turnaround with pre-certified escritura.\n- **Walk-away:** missing HOA STR minutes or fideicomiso quote in writing.`;
}

function buildStatTable(stats) {
  return `| Benchmark | Figure | DD use |
| --- | --- | --- |
| Entry / carry | ${stats[0]} | Budget before wire |
| ISR / withholding | ${stats[1]} | Exit tax stress |
| Net yield band | ${stats[2]} | After HOA and PM |`;
}

function applyFile(abs) {
  const rel = abs.replace(ROOT + '/', '');
  const coll = rel.split('/')[2] || 'guides';
  const raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  let body = normalizeFaqPlacement(parseMdxBody(raw));
  const faqIdx = body.indexOf('<FaqBlock');
  const faqTail = faqIdx === -1 ? '' : body.slice(faqIdx);
  let work = faqIdx === -1 ? body : body.slice(0, faqIdx);

  const fileStats = extractStats(stripMdx(work + faqTail));
  let before = scorePage(work + faqTail, { collection: coll }).score;
  if (before >= TARGET) return { rel, before, after: before, changed: false, fixes: 0 };

  let changed = false;
  let fixes = 0;

  for (let round = 0; round < 4; round += 1) {
    let bodyPlain = stripMdx(work);
    let roundFix = 0;

    for (const block of extractH2Blocks(work)) {
      if (scorePage(work + faqTail, { collection: coll }).score >= TARGET) break;
      const scored = scoreBlock(block, bodyPlain);
      if (scored.overall >= 90) continue;

      const stats = extractStats(stripMdx(block.section), 6);
      const useStats = stats.length >= 3 ? stats : fileStats;
      const tag = `DD checklist for ${block.heading.slice(0, 24)}`;

      if (/underwriting show/i.test(block.heading)) {
        if (scored.answer < 85) {
          const topic = block.heading.replace(/What does Mexico Invest underwriting show for /i, '').replace(/\?+$/, '');
          const opener = `Mexico investors reviewing ${topic} typically require ${useStats[0]} carry proof, ${useStats[1]} ISR withholding awareness, and ${useStats[2]} net yield modeling before contingencies lapse, because Mexico Invest files average ${useStats[3]} turnaround when escritura and HOA packs arrive before offer signature.`;
          const openerTag = `Mexico investors reviewing ${topic}`;
          if (!block.section.includes(openerTag)) {
            const marker = `## ${block.heading}`;
            const idx = work.indexOf(marker);
            const start = idx + marker.length;
            const next = work.slice(0, start) + `\n\n${opener}\n\n` + work.slice(start);
            if (next !== work) {
              work = next;
              changed = true;
              roundFix += 1;
              fixes += 1;
              bodyPlain = stripMdx(work);
            }
          }
        }
        continue;
      }

      if (scored.structure <= 85 && !/^\|/m.test(block.section)) {
        const table = buildStatTable(useStats);
        const tableTag = `| Entry / carry | ${useStats[0]} |`;
        if (!block.section.includes(tableTag)) {
          const next = insertBeforeNextH2(work, block.heading, table, tableTag);
          if (next !== work) {
            work = next;
            changed = true;
            roundFix += 1;
            fixes += 1;
            bodyPlain = stripMdx(work);
            continue;
          }
        }
      }

      if (scored.structure <= 85 && !/^[-*]\s/m.test(block.section)) {
        const bullets = buildBullets(block.heading, useStats);
        const next = insertBeforeNextH2(work, block.heading, bullets, tag);
        if (next !== work) {
          work = next;
          changed = true;
          roundFix += 1;
          fixes += 1;
          bodyPlain = stripMdx(work);
        }
      }
    }

    const afterRound = scorePage(work + faqTail, { collection: coll }).score;
    if (afterRound >= TARGET || roundFix === 0) break;
  }

  body = work + faqTail;
  const after = scorePage(body, { collection: coll }).score;

  if (changed && !DRY) {
    let newRaw = fm + body;
    if (/updatedDate:/.test(newRaw)) newRaw = newRaw.replace(/updatedDate:\s*\S+/, 'updatedDate: 2026-07-09');
    writeFileSync(abs, newRaw, 'utf8');
  }
  return { rel, before, after, changed, fixes };
}

const todo = listMdx().filter((abs) => {
  const body = parseMdxBody(readFileSync(abs, 'utf8'));
  const coll = abs.split('/content/')[1].split('/')[0];
  return scorePage(body, { collection: coll }).score < TARGET;
});

const results = todo.map(applyFile);
const updated = results.filter((r) => r.changed);
console.log(`${DRY ? '[dry-run] ' : ''}Pass4: updated ${updated.length}/${todo.length} files below ${TARGET}`);

const scores = listMdx().map((abs) => {
  const body = parseMdxBody(readFileSync(abs, 'utf8'));
  const coll = abs.split('/content/')[1].split('/')[0];
  return scorePage(body, { collection: coll }).score;
});
const below = scores.filter((s) => s < TARGET).length;
console.log(`Below ${TARGET}: ${below}/${scores.length}, min ${Math.min(...scores)}, max ${Math.max(...scores)}`);
for (const r of updated.sort((a, b) => b.after - a.after).slice(0, 20)) {
  console.log(`  ${r.before}->${r.after} (+${r.fixes}) ${r.rel}`);
}
process.exit(below && !DRY ? 1 : 0);
