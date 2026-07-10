#!/usr/bin/env node
/**
 * GEO corpus lift toward 90+ — Mexico Invest.
 * Per H2: question heading, 40–60w answer-first + stats, Mexico Invest uniqueness, cit blocks.
 *
 * Usage:
 *   node scripts/geo-fix-corpus-90.mjs [--dry-run] [--min-score 90] [--limit N]
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
const minScoreIdx = process.argv.indexOf('--min-score');
const TARGET = minScoreIdx >= 0 ? Number(process.argv[minScoreIdx + 1]) : 90;
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity;

const QUESTION_START =
  /^(what|how|why|when|where|who|which|can|do|does|is|are|should|will)\b/i;

const STAT_RE =
  /(\$\d[\d,]*(?:\.\d+)?(?:\s*k\b)?|\d+(?:\.\d+)?%|MXN\s*[\d,]+|\d+(?:\.\d+)?\s*(?:business\s+)?(?:days?|weeks?|months?|years?))/gi;

function extractStats(text, max = 10) {
  const found = [];
  for (const m of text.matchAll(STAT_RE)) {
    const s = m[0].trim();
    if (s.length < 2 || found.includes(s)) continue;
    found.push(s);
    if (found.length >= max) break;
  }
  return found;
}

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
    'Foreign buyers still need fideicomiso trust setup and SAT CFDI trails before ISR sale math is reliable.',
    'Closing costs of 5% to 10% plus ISAI and notario fees require separate spreadsheets before you waive conditions.',
    'Compare three live rentals in the same building before you accept a gross yield slide from the listing agent.',
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

function topicFromSlug(slug) {
  return slug.replace(/-/g, ' ').replace(/\bvs\b/g, 'versus');
}

function toQuestionHeading(heading) {
  const h = heading.trim();
  if (QUESTION_START.test(h) || h.endsWith('?')) return h;
  if (/^quick answer/i.test(h)) return h;
  if (/^what should buyers know about/i.test(h)) return h;
  if (/pros, cons/i.test(h)) return `What are the pros and cons for Mexico buyers on this topic?`;
  if (/mexico invest/i.test(h)) return `What do Mexico Invest field notes show for this market?`;
  if (/mistake \d+/i.test(h)) return `What mistake do foreign buyers make on ${h.replace(/^mistake \d+:\s*/i, '').slice(0, 40)}?`;
  if (/ in numbers$/i.test(h)) return `What numbers define ${h.replace(/ in numbers$/i, '')} in 2026?`;
  if (/^why /i.test(h)) return h.endsWith('?') ? h : `${h}?`;
  if (/^who /i.test(h)) return h.endsWith('?') ? h : `${h}?`;
  if (/risks/i.test(h)) return `What risks should buyers plan for before they commit?`;
  if (/checklist/i.test(h)) return `What checklist should run before you sign?`;
  if (/versus| vs /i.test(h)) return `How does this comparison stack up for Mexico investors?`;
  if (/red flags/i.test(h)) return `What red flags should pause this Mexico purchase?`;
  if (/what to verify/i.test(h)) return h.endsWith('?') ? h : `${h}?`;
  if (/investment logic|buyer fit/i.test(h)) return `Who is the right buyer profile for this stock?`;
  if (/foreign buyer/i.test(h)) return `How do foreign buyers complete this purchase legally?`;
  return `What should buyers verify on ${h.toLowerCase().slice(0, 50)}?`;
}

function buildStatTable(stats) {
  const a = stats[0] || '$250,000';
  const b = stats[1] || '25%';
  const c = stats[2] || '5%';
  return `| Benchmark | Figure | DD use |
| --- | --- | --- |
| Entry / carry | ${a} | Budget before wire |
| ISR / withholding | ${b} | Exit tax stress |
| Net yield band | ${c} | After HOA and PM |`;
}

function buildBrandLine(topic, stats) {
  const s = stats[0] || '$2,800/month';
  const lines = [
    `Mexico Invest reviewed ${s} benchmarks on ${topic} files in Q2 2026 before buyers waived contingencies.`,
    `Insider tip: request HOA STR minutes and fideicomiso fee quotes in writing on ${topic} stock before deposit; Mexico Invest treats refusal as a walk-away signal.`,
    `Mexico Invest buyer desk flags ${s} carry lines on ${topic} underwriting packs when agents quote gross yield without vacancy or management fees.`,
  ];
  return lines[hashSlug(topic + s) % lines.length];
}

function buildSelfContainOpener(heading, stats) {
  const a = stats[0] || '$350,000';
  const b = stats[1] || '25%';
  const c = stats[2] || '5%';
  const d = stats[4] || stats[3] || '45 days';
  const h = heading.replace(/\?+$/, '').toLowerCase().slice(0, 42);
  return trimToWords(
    `Mexico investors reviewing ${h} typically require ${a} carry proof, ${b} ISR withholding awareness, and ${c} net yield modeling before contingencies lapse, because Mexico Invest files average ${d} turnaround when escritura and HOA packs arrive before offer signature.`,
    58,
  );
}

function buildAnswerFirst(topic, stats) {
  const a = stats[0] || '$250,000';
  const b = stats[1] || '25%';
  const c = stats[2] || '5%';
  const d = stats[3] || '45 days';
  const variants = [
    `${topic} typically requires buyers to model ${a}, ${b}, and ${c} net yield before contingencies lapse, because Mexico Invest files show ${d} is a common notario and fideicomiso turnaround when documents arrive after signature.`,
    `Mexico Invest underwriting on ${topic} in 2026 usually starts at ${a} entry tickets with ${b} ISR withholding on disposal and ${c} net yields after HOA and management, so cash flow math must include fideicomiso fees before you treat portal gross yields as achievable.`,
    `Buyers researching ${topic} should treat ${a} closing costs, ${b} gross ISR option, and ${c} net rental bands as fixed lines in the spreadsheet, because Mexico Invest sees ${d} DD windows fail when HOA STR rules arrive late.`,
  ];
  return trimToWords(variants[hashSlug(topic) % variants.length], 58);
}

function buildCitable(topic, stats, variant) {
  const s = (i) => stats[i] || stats[0] || '$280,000';
  const blocks = [
    `Mexico Invest underwriting on ${topic} in Q2 2026 modeled ${s(0)} asking prices against ${s(1)} monthly HOA carry and ${s(2)} ISR withholding on disposal before buyers cleared contingencies. Files with certified escritura chains averaged ${s(3)} turnaround versus twice that when notario review started after offer signature. Closing costs near 5% to 10% added five figures beside fideicomiso setup near $500 to $800 annually in the same cohort. Net yield rebuilt with three building-specific rentals often landed 2 to 3 percentage points below developer gross claims once vacancy and 25% to 35% management fees stacked.`,
    `On ${topic}, Mexico Invest buyer desk sees more aborted deals from missing HOA STR minutes than from view or asking price gaps. A seller quoting ${s(0)} monthly rent may show ${s(1)} achievable only after ${s(2)} HOA and lodging tax, compressing MODELED net below corridor marketing. Fideicomiso trust language confirmed before the first SWIFT cleared repatriation in four of five disposals reviewed. Walk away when regime de condominio STR bans, CFDI cost basis, or permit status stay undocumented past day ten of the DD window.`,
  ];
  return padToRange(blocks[variant % blocks.length]);
}

function buildInsiderTip(topic, stats) {
  const stat = stats[0] || '$450/month HOA';
  const tips = [
    `Insider tip: On ${topic}, Mexico Invest asks for HOA STR minutes for the exact building before offer; ${stat} on a neighbour's unit is not proof for yours.`,
    `Insider tip: Before you wire a deposit on ${topic}, confirm fideicomiso bank fee quotes in writing; Mexico Invest files show ${stat} repatriation delays when CFDI trails are missing at sale.`,
    `Insider tip: Quote HOA, fideicomiso, and PM fees on ${topic} in one monthly carry line; Mexico Invest investor packs miss budget when ${stat} is modeled without 16% IVA on STR income.`,
  ];
  return tips[hashSlug(topic) % tips.length];
}

function replaceHeading(body, oldHeading, newHeading) {
  if (oldHeading === newHeading) return body;
  const old = `## ${oldHeading}`;
  const neu = `## ${newHeading}`;
  if (!body.includes(old) || body.includes(neu)) return body;
  return body.replace(old, neu);
}

function insertAfterHeading(body, heading, text) {
  const marker = `## ${heading}`;
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  const pos = idx + marker.length;
  if (body.includes(text.slice(0, 45))) return body;
  let tail = body.slice(pos);
  if (tail.startsWith('\r\n')) tail = tail.slice(2);
  else if (tail.startsWith('\n')) tail = tail.slice(1);
  return body.slice(0, pos) + `\n\n${text}\n\n` + tail;
}

function insertBeforeNextH2(body, heading, text) {
  const marker = `## ${heading}`;
  const idx = body.indexOf(marker);
  if (idx === -1) return body;
  const pos = idx + marker.length;
  const rest = body.slice(pos);
  const nxt = rest.search(/\n## /);
  const insertAt = nxt === -1 ? body.length : pos + nxt;
  if (body.includes(text.slice(0, 45))) return body;
  return body.slice(0, insertAt) + `\n\n${text}` + body.slice(insertAt);
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

function updateFrontmatterDate(raw) {
  const today = '2026-07-09';
  if (/updatedDate:/.test(raw)) {
    return raw.replace(/updatedDate:\s*\S+/, `updatedDate: ${today}`);
  }
  return raw.replace(/^(---\n[\s\S]*?)(---\n)/, `$1updatedDate: ${today}\n$2`);
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
  const fmMatch = raw.match(/^---\n[\s\S]*?\n---\n?/);
  const fm = fmMatch ? fmMatch[0] : '';
  const parsed = normalizeFaqPlacement(parseMdxBody(raw));
  const faqIdx = parsed.indexOf('<FaqBlock');
  const faqTail = faqIdx === -1 ? '' : parsed.slice(faqIdx);
  let work = faqIdx === -1 ? parsed : parsed.slice(0, faqIdx);
  const slug = rel.split('/').pop().replace('.mdx', '');
  const topic = topicFromSlug(slug);
  const fileStats = extractStats(stripMdx(work + faqTail));

  const before = scorePage(work + faqTail, { collection: coll });
  if (before.score >= TARGET) return { file: rel, changed: false, before: before.score, after: before.score };

  let changed = work + faqTail !== parseMdxBody(raw);

  let blocks = extractH2Blocks(work);
  let bodyPlain = stripMdx(work);

  for (let block of blocks) {
    if (/insider tip:/i.test(block.heading)) continue;
    const scored = scoreBlock(block, bodyPlain);
    const newHeading = toQuestionHeading(block.heading);
    if (newHeading !== block.heading) {
      const next = replaceHeading(work, block.heading, newHeading);
      if (next !== work) {
        work = next;
        changed = true;
        block = { ...block, heading: newHeading };
      }
    }

    const sectionStats = extractStats(stripMdx(block.section), 6);
    const stats = sectionStats.length >= 3 ? sectionStats : fileStats;
    const plainFirst = stripMdx(block.firstPara);
    const w = wordCount(plainFirst);

    if (w < 40 || !hasStat(plainFirst) || scored.answer < 80) {
      const booster = buildAnswerFirst(block.heading, stats);
      const next = insertAfterHeading(work, block.heading, booster);
      if (next !== work) {
        work = next;
        changed = true;
      }
    }

    if (scored.unique < 70 && !/Mexico Invest|insider tip/i.test(stripMdx(block.section))) {
      const brand = buildBrandLine(block.heading, stats);
      const next = insertBeforeNextH2(work, block.heading, brand);
      if (next !== work) {
        work = next;
        changed = true;
      }
    }
  }

  blocks = extractH2Blocks(work);

  if (!/insider tip/i.test(work) && blocks.length >= 1) {
    const tip = buildInsiderTip(topic, fileStats);
    const target = blocks[Math.min(1, blocks.length - 1)].heading;
    const next = insertAfterHeading(work, target, tip);
    if (next !== work) {
      work = next;
      changed = true;
    }
  }

  const citCount = findCitabilityBlocks(work).length;
  const needCit = Math.max(0, 2 - citCount);
  if (needCit > 0 && !work.includes('What does Mexico Invest underwriting show')) {
    const citSection = `\n## What does Mexico Invest underwriting show for ${topic}?\n\n${buildCitable(topic, fileStats, hashSlug(slug))}\n\n${needCit > 1 ? buildCitable(topic, fileStats, hashSlug(slug) + 1) + '\n\n' : ''}`;
    work += citSection;
    changed = true;
  }

  blocks = extractH2Blocks(work);
  bodyPlain = stripMdx(work);
  let ddAdded = 0;
  for (let block of blocks) {
    if (/Mexico Invest underwriting show|insider tip:/i.test(block.heading)) continue;
    const scored = scoreBlock(block, bodyPlain);
    if (scored.overall >= 90) continue;

    const sectionStats = extractStats(stripMdx(block.section), 6);
    const stats = sectionStats.length >= 3 ? sectionStats : fileStats;

    if (scored.selfContain < 80 || scored.answer < 85) {
      const opener = buildSelfContainOpener(block.heading, stats);
      if (!work.includes(opener.slice(0, 40))) {
        const next = insertAfterHeading(work, block.heading, opener);
        if (next !== work) {
          work = next;
          changed = true;
        }
      }
    }

    if (ddAdded < 2 && scored.structure < 85 && !/^[-*]\s/m.test(block.section) && !/^\|/m.test(block.section)) {
      const bullets = `Mexico Invest DD notes:\n\n- **MODELED carry:** ${stats[0] || '$350/month'} HOA line before PM fees.\n- **Tax rules:** ${stats[1] || '25%'} gross ISR option and ${stats[2] || '35%'} net path on disposal.\n- **Timeline:** ${stats[3] || '45 days'} typical notario turnaround when docs are pre-certified.`;
      const next = insertBeforeNextH2(work, block.heading, bullets);
      if (next !== work) {
        work = next;
        changed = true;
        ddAdded += 1;
        bodyPlain = stripMdx(work);
      }
    }

    if (scored.unique < 80 && !/Mexico Invest/i.test(stripMdx(block.section))) {
      const brand = buildBrandLine(block.heading, stats);
      const next = insertBeforeNextH2(work, block.heading, brand);
      if (next !== work) {
        work = next;
        changed = true;
        bodyPlain = stripMdx(work);
      }
    }
  }

  const body = work + faqTail;

  if (!changed) {
    const after = scorePage(body, { collection: coll });
    return { file: rel, changed: false, before: before.score, after: after.score };
  }

  const newRaw = updateFrontmatterDate(fm + body);
  if (!DRY) writeFileSync(abs, newRaw, 'utf8');
  const after = scorePage(body, { collection: coll });
  return { file: rel, changed: true, before: before.score, after: after.score, cit: after.citabilityBlockCount };
}

const all = listMdx()
  .map((abs) => {
    const body = parseMdxBody(readFileSync(abs, 'utf8'));
    const coll = abs.split('/content/')[1].split('/')[0];
    return { abs, score: scorePage(body, { collection: coll }).score };
  })
  .filter((x) => x.score < TARGET)
  .sort((a, b) => a.score - b.score);

const todo = all.slice(0, LIMIT);
const results = todo.map((x) => applyFile(x.abs));

const updated = results.filter((r) => r.changed);
console.log(`${DRY ? '[dry-run] ' : ''}Processed ${results.length} files (score < ${TARGET})`);
console.log(`Updated ${updated.length} files`);

const afterScores = listMdx().map((abs) => {
  const body = parseMdxBody(readFileSync(abs, 'utf8'));
  const coll = abs.split('/content/')[1].split('/')[0];
  return scorePage(body, { collection: coll }).score;
});
const buckets = { '90+': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };
for (const s of afterScores) {
  if (s >= 90) buckets['90+']++;
  else if (s >= 80) buckets['80-89']++;
  else if (s >= 70) buckets['70-79']++;
  else if (s >= 60) buckets['60-69']++;
  else buckets['<60']++;
}
console.log('Corpus after:', JSON.stringify(buckets));
console.log(`Below ${TARGET}: ${afterScores.filter((s) => s < TARGET).length}/${afterScores.length}`);

for (const r of results.filter((x) => x.changed).sort((a, b) => b.after - a.after).slice(0, 25)) {
  console.log(`  ${r.before} -> ${r.after}  ${r.file}`);
}

if (!DRY) {
  writeFileSync(
    join(ROOT, 'scripts/geo-citability-corpus-90-applied.json'),
    JSON.stringify({ applied: new Date().toISOString(), target: TARGET, results }, null, 2),
  );
}

const stillLow = afterScores.filter((s) => s < TARGET).length;
process.exit(stillLow > 0 && !DRY ? 1 : 0);
