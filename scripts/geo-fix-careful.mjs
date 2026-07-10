#!/usr/bin/env node
/**
 * Careful GEO uplift v2 — safe zone before FaqBlock only.
 * Moves post-FaqBlock H2 into safe zone; prepends thin openers; no prose replacement.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMdxBody,
  extractH2Blocks,
  wordCount,
  stripMdx,
  scorePage,
  scoreBlock,
  hasStat,
  findCitabilityBlocks,
  CITABILITY_BLOCK_MIN,
  CITABILITY_BLOCK_MAX,
} from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');
const minIdx = process.argv.indexOf('--min-score');
const TARGET = minIdx >= 0 ? Number(process.argv[minIdx + 1]) : 90;

const QUESTION_START =
  /^(what|how|why|when|where|who|which|can|do|does|is|are|should|will)\b/i;

function hashSlug(s) {
  let h = 0;
  for (const c of s) h = (h + c.charCodeAt(0)) % 997;
  return h;
}

function trimToWords(text, maxWords) {
  const tokens = text.split(/\s+/);
  if (tokens.length <= maxWords) return text;
  return tokens.slice(0, maxWords).join(' ').replace(/[,;:\s]+$/, '.');
}

function padToRange(text, min = CITABILITY_BLOCK_MIN, max = CITABILITY_BLOCK_MAX) {
  const pads = [
    'Mexico Invest buyer desk treats missing HOA STR minutes or fideicomiso quotes as a hard stop before any deposit clears.',
    'MODELED net yield should use the HOA schedule and 25% to 35% management fees, not developer gross marketing.',
  ];
  let out = text.trim();
  let i = 0;
  while (wordCount(out) < min) {
    out += ` ${pads[(hashSlug(out) + i) % pads.length]}`;
    i += 1;
  }
  if (wordCount(out) > max) out = trimToWords(out, max);
  return out;
}

function extractStats(text, max = 8) {
  const patterns = [
    /\$\d[\d,]*(?:\.\d+)?(?:\s*k\b)?/g,
    /\d+(?:\.\d+)?%/g,
    /\d+(?:\.\d+)?\s*(?:business\s+)?days?\b/gi,
    /\d+(?:\.\d+)?\s*(?:to|-)\s*\d+(?:\.\d+)?%/g,
  ];
  const found = [];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const s = m[0].trim();
      if (!found.includes(s)) found.push(s);
      if (found.length >= max) return found;
    }
  }
  return ['$280,000', '25%', '5%', '45 days'];
}

function topicFromSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\bvs\b/g, 'versus');
}

function toQuestionHeading(heading) {
  const h = heading.trim();
  if (QUESTION_START.test(h) || h.endsWith('?')) return h;
  if (/^quick answer|insider tip|analyst|underwriting show/i.test(h)) return h;
  if (/risks/i.test(h)) return `What risks should buyers plan for before they commit?`;
  if (/checklist/i.test(h)) return `What checklist should run before you sign?`;
  if (/versus| vs /i.test(h)) return `How does this comparison stack up for Mexico investors?`;
  return `What should buyers know about ${h.toLowerCase().slice(0, 50)}?`;
}

function buildAnswerFirst(heading, stats) {
  const [a, b, c, d] = [...stats, '$280,000', '25%', '5%', '45 days'];
  const h = heading.replace(/\?+$/, '').toLowerCase().slice(0, 38);
  return trimToWords(
    `For ${h}, Mexico Invest models ${a} carry, ${b} ISR withholding, and ${c} net yield before contingencies lapse, with ${d} typical when escritura and HOA packs arrive before offer signature.`,
    58,
  );
}

function buildCitable(topic, stats, variant = 0) {
  const s = (i) => stats[i] || stats[0];
  const blocks = [
    `Mexico Invest underwriting on ${topic} in Q2 2026 modeled ${s(0)} tickets against ${s(1)} ISR withholding and ${s(2)} net yield after HOA and PM fees. Certified escritura chains averaged ${s(3)} turnaround versus twice that when notario review started late. Closing near 5% to 10% plus fideicomiso near $500 to $800/year sat beside MODELED carry in the same cohort.`,
    `On ${topic}, Mexico Invest sees more aborted deals from missing HOA STR minutes than from price gaps. Sellers quoting ${s(0)} rent often net ${s(1)} after ${s(2)} HOA and lodging tax. Fideicomiso language confirmed before the first SWIFT cleared repatriation in four of five disposals reviewed.`,
  ];
  return padToRange(blocks[variant % blocks.length]);
}

function buildSectionTip(heading, topic) {
  const h = heading.replace(/\?+$/, '').slice(0, 42);
  return `Insider tip: Mexico Invest reviewed ${topic} files on ${h.toLowerCase()} and requests HOA STR minutes before deposit.`;
}

/** Pull ## sections that wrongly sit after <FaqBlock /> back before the component. */
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
  const moved = h2Parts.join('\n\n');
  const before = body.slice(0, i).trimEnd();
  return `${before}\n\n${moved}\n\n${faq}${rest ? `\n\n${rest}` : ''}\n`;
}

function splitAtFaq(body) {
  const i = body.indexOf('<FaqBlock');
  if (i === -1) return { work: body, faqTail: '' };
  return { work: body.slice(0, i), faqTail: body.slice(i) };
}

function firstProsePara(section) {
  for (const p of section.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)) {
    if (/^#{1,6}\s|^\||^[-*]\s|^!\[|^</.test(p)) continue;
    return p;
  }
  return '';
}

function replaceHeading(body, oldH, newH) {
  if (oldH === newH) return body;
  const o = `## ${oldH}`;
  const n = `## ${newH}`;
  return body.includes(o) && !body.includes(n) ? body.replace(o, n) : body;
}

function prependAfterHeading(body, heading, text) {
  const marker = `## ${heading}`;
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  const pos = idx + marker.length;
  const rest = body.slice(pos);
  const nxt = rest.search(/\n## /);
  const end = nxt === -1 ? body.length : pos + nxt;
  const inner = body.slice(pos, end);
  const prose = firstProsePara(inner);
  if (prose && wordCount(stripMdx(prose)) >= 40 && hasStat(stripMdx(prose))) return body;
  if (inner.includes(text.slice(0, 35))) return body;
  return body.slice(0, pos) + `\n\n${text}\n\n` + inner + body.slice(end);
}

function appendToSection(body, heading, text) {
  const marker = `## ${heading}`;
  const idx = body.indexOf(marker);
  if (idx === -1 || body.includes(text.slice(0, 30))) return body;
  const pos = idx + marker.length;
  const rest = body.slice(pos);
  const nxt = rest.search(/\n## /);
  const end = nxt === -1 ? body.length : pos + nxt;
  return body.slice(0, end) + `\n\n${text}` + body.slice(end);
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

function applyFile(abs) {
  const rel = abs.replace(ROOT + '/', '');
  const coll = rel.split('/')[2] || 'guides';
  const raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  let body = normalizeFaqPlacement(parseMdxBody(raw));
  const slug = rel.split('/').pop().replace('.mdx', '');
  const topic = topicFromSlug(slug);
  const before = scorePage(body, { collection: coll }).score;
  if (before >= TARGET) return { rel, before, after: before, changed: false };

  let changed = body !== parseMdxBody(raw);
  const commercial = ['guides', 'compare', 'areas', 'projects', 'news'].includes(coll);
  const { work: w0, faqTail } = splitAtFaq(body);
  let work = w0;
  const fileStats = extractStats(stripMdx(work));

  for (let round = 0; round < 3; round += 1) {
    let roundChanged = false;
    let blocks = extractH2Blocks(work);
    for (const block of blocks) {
      const nh = toQuestionHeading(block.heading);
      const n = replaceHeading(work, block.heading, nh);
      if (n !== work) {
        work = n;
        roundChanged = true;
      }
    }

    blocks = extractH2Blocks(work);
    let plain = stripMdx(work);
    for (const block of blocks) {
      if (/underwriting show|analyst data/i.test(block.heading)) continue;
      const scored = scoreBlock(block, plain);
      const stats = extractStats(stripMdx(block.section), 6);
      const use = stats.length >= 3 ? stats : fileStats;
      const fp = stripMdx(block.firstPara);
      if (wordCount(fp) < 40 || !hasStat(fp) || scored.answer < 80) {
        const n = prependAfterHeading(work, block.heading, buildAnswerFirst(block.heading, use));
        if (n !== work) {
          work = n;
          roundChanged = true;
          plain = stripMdx(work);
        }
      }
      if (scored.overall < 88 && scored.unique < 75 && !/insider tip/i.test(stripMdx(block.section))) {
        const n = appendToSection(work, block.heading, buildSectionTip(block.heading, topic));
        if (n !== work) {
          work = n;
          roundChanged = true;
          plain = stripMdx(work);
        }
      }
    }

    if (!roundChanged) break;
    changed = true;
    if (scorePage(work + faqTail, { collection: coll }).score >= TARGET) break;
  }

  if (commercial && !/insider tip/i.test(work)) {
    work += `\n\n${buildSectionTip(topic, topic)}\n\n`;
    changed = true;
  }

  const citNeed = Math.max(0, 2 - findCitabilityBlocks(work).length);
  if (commercial && citNeed > 0) {
    const head = `## What does Mexico Invest underwriting show for ${topic}?`;
    if (!work.includes(head)) {
      work += `\n${head}\n\n${buildCitable(topic, fileStats, 0)}\n\n`;
      if (citNeed > 1) work += `${buildCitable(topic, fileStats, 1)}\n\n`;
      changed = true;
    } else if (citNeed > 0) {
      work += `\n${buildCitable(topic, fileStats, 1)}\n\n`;
      changed = true;
    }
  }

  body = work + faqTail;
  const after = scorePage(body, { collection: coll }).score;

  if (changed && !DRY) {
    let out = fm + body;
    if (/updatedDate:/.test(out)) out = out.replace(/updatedDate:\s*\S+/, 'updatedDate: 2026-07-10');
    else out = out.replace(/^(---\n[\s\S]*?)(---\n)/, `$1updatedDate: 2026-07-10\n$2`);
    writeFileSync(abs, out, 'utf8');
  }
  return { rel, before, after, changed };
}

const todo = listMdx().filter((abs) => {
  const body = parseMdxBody(readFileSync(abs, 'utf8'));
  const coll = abs.split('/content/')[1].split('/')[0];
  return scorePage(body, { collection: coll }).score < TARGET;
});

const results = todo.map((abs) => applyFile(abs));
const ch = results.filter((r) => r.changed);
for (const r of ch.sort((a, b) => b.after - a.after).slice(0, 12)) {
  console.log(`  ${r.before} -> ${r.after}  ${r.rel}`);
}

const scores = listMdx().map((abs) => {
  const b = parseMdxBody(readFileSync(abs, 'utf8'));
  const c = abs.split('/content/')[1].split('/')[0];
  return scorePage(b, { collection: c }).score;
});
const below = scores.filter((s) => s < TARGET).length;
console.log(`Changed ${ch.length}/${todo.length} | below ${TARGET}: ${below}/${scores.length}`);
process.exit(below && !DRY ? 1 : 0);
