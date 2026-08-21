#!/usr/bin/env node
/**
 * Wave 1 — remove the generated boilerplate layer from the MDX corpus.
 *
 * The Phase 0 audit found ~13,000 instances of a small set of padded sentences
 * whose numbers were filled from a shared pool, plus two GEO blocks appended to
 * the end of every article, plus 3,996 real section headings that a generator had
 * wrapped in "What should buyers verify on {heading}?" (lowercased and truncated
 * at 50 characters).
 *
 * This removes the boilerplate and restores the headings. It does NOT rewrite
 * prose — anything specific enough to be worth keeping is left exactly as it is,
 * and pages that end up thin are flagged for the hand-written pass.
 *
 * Deliberately narrow: every pattern below is an exact generated shape, anchored
 * to sentence or block boundaries. No paragraph is removed by a newline-stripping
 * regex, and nothing is matched on a fuzzy "looks like filler" basis.
 *
 * Usage:
 *   node scripts/fix-corpus-boilerplate.mjs --dry            # report only
 *   node scripts/fix-corpus-boilerplate.mjs                  # apply
 *   node scripts/fix-corpus-boilerplate.mjs --only guides    # one collection
 *   node scripts/fix-corpus-boilerplate.mjs --file <slug>    # one file
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const only = (argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1];
const oneFile = (argv.find((a) => a.startsWith('--file=')) ?? '').split('=')[1];

/* ------------------------------------------------------------ boilerplate */

/**
 * Sentence interior: anything but a sentence terminator, except a decimal point
 * inside a number ("6.50%"), which the generator's pooled fillers are full of.
 */
const IN = String.raw`(?:[^.\n]|\.(?=\d))`;
const re = (body, flags = 'g') => new RegExp(body, flags);

/**
 * Whole sentences the generator inserted. Each is anchored so it can only match
 * from a sentence start to its own terminator — never across a paragraph.
 */
const SENTENCES = [
  // "Mexico investors typically require X carry proof, Y ISR withholding awareness,
  //  and Z net yield modeling before contingencies lapse, because ... offer signature."
  re(`Mexico investors typically require ${IN}{0,240}?net yield modeling before contingencies lapse${IN}{0,240}?\\.`),
  // "Mexico Invest underwriting on {topic} in 2026 usually starts at X entry tickets ..."
  re(`(?:Mexico Invest underwriting on ${IN}{0,200}?)?in 20\\d\\d usually starts at ${IN}{0,260}?before you treat portal gross yields as achievable\\.`),
  // "Mexico Invest underwriting on {slug} in Q2 2026 modeled X asking prices against ..."
  re(`Mexico Invest underwriting on ${IN}{0,200}?modeled ${IN}{0,200}?before buyers cleared contingencies\\.`),
  // "On {slug}, Mexico Invest buyer desk sees more aborted deals from ..."
  re(`On ${IN}{0,120}?, Mexico Invest buyer desk sees more aborted deals from missing HOA STR minutes than from view or asking price gaps\\.`),
  // "A seller quoting X monthly rent may show Y achievable only after Z HOA and lodging tax, ..."
  re(`A seller quoting ${IN}{0,160}?compressing MODELED net below corridor marketing\\.`),
  re(`Compare three live rentals in the same building before you accept a gross yield slide from the listing agent\\.`),
  // The three stock closers.
  /MODELED net yield must include HOA, fideicomiso, and 25% to 35% PM fees before you compare gross claims\./g,
  /MODELED net yield should use the HOA schedule and 25% to 35% management fees, not developer gross marketing\./g,
  /Mexico Invest buyer desk treats missing HOA STR minutes(?: or fideicomiso quotes)? as a hard stop before any deposit clears\./g,
  /Foreign buyers (?:still )?need fideicomiso trust setup and SAT CFDI trails (?:recorded )?before (?:the first SWIFT clears|ISR sale math is reliable)\./g,
  // "Mexico Invest reviewed $X benchmarks on {H2 text} files in Q2 2026 before buyers waived contingencies."
  re(`Mexico Invest reviewed ${IN}{0,200}?files in Q\\d 20\\d\\d before buyers waived contingencies\\.`),
  // "Mexico Invest buyer desk flags $X carry lines on {H2 text} underwriting packs when ..."
  re(`Mexico Invest buyer desk flags ${IN}{0,220}?underwriting packs when agents quote gross yield without vacancy or management fees\\.`),
  // "Buyers researching {H2 text} should treat ... as fixed lines in the spreadsheet, because ..."
  re(`Buyers researching ${IN}{0,300}?(?:HOA STR rules arrive late|DD windows fail${IN}{0,80})\\.`),
  // Recurring "cohort" claims with pooled numbers.
  /Closing costs near 5% to 10% added five figures beside fideicomiso setup near \$500 to \$800 annually in the same cohort\./g,
  /Net yield rebuilt with three building-specific rentals often landed 2 to 3 percentage points below developer gross claims once vacancy and 25% to 35% management fees stacked\./g,
  /Fideicomiso trust language confirmed before the first SWIFT cleared repatriation in four of five disposals reviewed\./g,
  /Walk away when regime de condominio STR bans, CFDI cost basis, or permit status stay undocumented past day ten of the DD window\./g,
  re(`Files with certified escritura chains averaged ${IN}{0,60}? turnaround versus twice that when notario review started after offer signature\\.`),
  /Closing costs of 5% to 10% plus ISAI and notario fees require separate spreadsheets before you waive conditions\./g,
  re(`Mexico Invest (?:buyer desk )?(?:requests|treats) ${IN}{0,140}?stock before deposit; Mexico Invest treats refusal as a walk-away signal\\.`),
  // "{X} typically requires buyers to model A, B, and C net yield before contingencies
  //  lapse, because Mexico Invest files show D is a common notario and ..."
  re(`${IN}{0,80}?typically requires buyers to model ${IN}{0,200}?net yield before contingencies lapse${IN}{0,200}?\\.`),
  // The shared-facts block the generator pasted under two headings in every file.
  re(`When comparing ${IN}{0,120}?, treat developer renderings as marketing${IN}{0,200}?before reservation\\.`),
  /Apply this decision framework to [^.\n]{0,120}? before you wire any reservation deposit\./g,
  // Orphaned tails left when a pooled number split the sentence the generator built.
  /(?:^|(?<=[\s>]))[a-z][^.\n]{0,110}?files in Q\d 20\d\d before buyers waived contingencies\./g,
  /(?:^|(?<=[\s>]))[a-z][^.\n]{0,110}?underwriting packs when agents quote gross yield without vacancy or management fees\./g,
  /(?:^|(?<=[\s>]))[a-z][^.\n]{0,110}?before you treat portal gross yields as achievable\./g,
  /(?:^|(?<=[\s>]))[a-z][^.\n]{0,110}?before buyers cleared contingencies\./g,
  re(`(?:^|(?<=[\\s>]))[\\d$][^.\\n]{0,110}?turnaround when escritura and HOA packs arrive before offer signature\\.`),
  re(`(?:^|(?<=[\\s>]))[a-z\\d$][^.\\n]{0,140}?is a common notario${IN}{0,140}?\\.`),
];

/** Whole lines that are boilerplate on their own. */
const LINES = [
  // "Mexico investors reviewing {heading} typically require X carry proof, Y ISR
  //  withholding awareness, and ..." — often left unterminated by the generator.
  /^Mexico investors reviewing .*$/gm,
  // "Insider tip: On {truncated slug}, Mexico Invest requests $X HOA proof ..." and variants.
  /^Insider tip:.*$/gm,
  // "Mexico Invest DD checklist for {lowercased H2} :"
  /^Mexico Invest DD checklist for .*:\s*$/gm,
  // The four checklist bullets that follow it, with pooled fillers.
  /^- (?:Entry \/ carry|Tax path|Tax rules|Timeline|Walk-away|MODELED carry):.*$/gm,
  // "Mexico Invest DD notes:" / "DD checklist for ..." list headers left dangling.
  /^Mexico Invest DD notes:\s*$/gm,
  // The generic three-persona "buyer scenarios" block, identical in 43 files and
  // unrelated to the page it sits on. Page-specific scenarios are written by hand.
  /^\*\*Cash buyer under \$500K:\*\* Prioritise clear title[^\n]*$/gm,
  /^\*\*Yield-focused investor:\*\* Model net yield only after ISH lodging tax[^\n]*$/gm,
  /^\*\*Lifestyle second-home buyer:\*\* Accept lower nominal yield for walkability[^\n]*$/gm,
  // Padding blocks the old gate already knew about but never ran on.
  /^.*: holding and exit notes.*$/gm,
  /^.*: extra context \d+.*$/gm,
];

/** The randomly-filled benchmark table, header through last row. */
const BENCHMARK_TABLE =
  /^\| Benchmark \| Figure \| DD use \|\n\|[\s|:-]+\|\n(?:\|[^\n]*\|\n?){1,6}/gm;

/**
 * Two H2 sections the generator appended to the end of nearly every article.
 * Removed only when what survives the passes above is too thin to be an article
 * section; otherwise the surviving prose is kept and the heading is rewritten.
 */
const APPENDED_SECTIONS = [
  /^## What does Mexico Invest underwriting show for .*$/m,
  /^## What numbers should Mexico investors model on .*$/m,
];
const SECTION_KEEP_MIN_WORDS = 60;

/* --------------------------------------------------------- heading repair */

const ENTITIES = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/lib/corpus-entities.json'), 'utf8'),
);
const ENTITY_BY_LOWER = new Map(ENTITIES.map((e) => [e.toLowerCase(), e]));

/** Words that must not end a heading after truncation repair. */
const DANGLING = new Set([
  'a', 'an', 'and', 'as', 'at', 'before', 'but', 'by', 'for', 'from', 'in', 'into',
  'is', 'of', 'on', 'or', 'the', 'to', 'vs', 'when', 'with', 'without', 'your',
]);

/** Restore sentence case plus known proper nouns and acronyms. */
function recase(text) {
  const out = text
    .split(/(\s+|[/(),:–—-])/)
    .map((tok) => {
      const key = tok.toLowerCase();
      const hit = ENTITY_BY_LOWER.get(key);
      return hit ?? tok;
    })
    .join('');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** The generator truncated the payload at 50 chars; trim back to a clean boundary. */
function repairTruncation(payload) {
  if (payload.length < 49) return payload;
  // "buyer scenarios for american retiree mexico real" reads better as
  // "Buyer scenarios" than as a clipped phrase, so cut at the preposition.
  const prep = payload.match(/^(.{6,}?)\s+(?:for|on|in|at|to|with|before|after)\s+\S/i);
  if (prep && prep[1].split(/\s+/).length >= 2) return prep[1];
  const tokens = payload.split(/\s+/);
  const last = tokens[tokens.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
  // A trailing token that is not a word we know is a mid-word cut.
  if (last && !ENTITY_BY_LOWER.has(last) && !KNOWN_WORDS.has(last)) tokens.pop();
  while (tokens.length > 1 && DANGLING.has(tokens[tokens.length - 1].toLowerCase().replace(/[^a-z]/g, ''))) {
    tokens.pop();
  }
  return tokens.join(' ').replace(/[,:;]\s*$/, '');
}

/** Vocabulary of the corpus, used only to spot a mid-word truncation. */
const KNOWN_WORDS = new Set();
for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const body = fs.readFileSync(path.join(dir, file), 'utf8').toLowerCase();
    for (const w of body.match(/\b[a-z]{2,}\b/g) ?? []) KNOWN_WORDS.add(w);
  }
}

function rewriteHeadings(body, stats) {
  return body.replace(/^## (.+)$/gm, (line, heading) => {
    // "What should buyers verify on {original heading}?" -> the original heading.
    const verify = heading.match(/^What should buyers verify on (.+)\?$/i);
    if (verify) {
      const payload = repairTruncation(verify[1].trim());
      if (!payload) return line;
      stats.headingsRestored++;
      return `## ${recase(payload)}`;
    }
    return line;
  });
}

/* ------------------------------------------------------- raw slug leakage */

/**
 * The generator wrote the de-hyphenated slug into headings, prose and FAQ questions
 * in lower case: "What is gran tulum?", "Who should buy akumal?". For a project or
 * area that string is the entity's name and only needs its capitals back; for a
 * guide it is an internal topic label that should not be in reader-facing copy at all.
 */
function displayName(title, slug) {
  const head = String(title).split(':')[0].trim();
  const cleaned = head
    .replace(/\s+(?:Review|Guide|Investment Guide|Real Estate|Developer Profile)\b.*$/i, '')
    .replace(/\s+20\d\d$/, '')
    .trim();
  return cleaned || recase(slug.replace(/-/g, ' '));
}

/** Headings where the slug was a label, not a name — the parenthetical just goes. */
const SLUG_PARENTHETICAL = /^## (What to verify next|Closing verification checklist|Buyer scenarios|Investor takeaway|Due diligence checklist)\s*\(([^)]*)\)\s*$/gim;

function fixSlugLeak(body, { title, slug, collection }, stats) {
  const words = slug.replace(/-/g, ' ');
  if (words.length < 6) return body;
  const name = displayName(title, slug);
  const isEntity = collection === 'projects' || collection === 'areas' || collection === 'developers';

  let out = body.replace(SLUG_PARENTHETICAL, (m, label) => {
    stats.slugLeaksFixed++;
    return `## ${label}`;
  });

  // Whole-phrase, case-insensitive, word-bounded. Only the lower-cased generator
  // spelling is touched — copy that already reads correctly is left alone, and
  // link targets, image paths and frontmatter slugs are never rewritten.
  const rawSlug = new RegExp(
    `(\\]\\([^)]*|\\bhttps?://\\S*|^\\s+-\\s+"?[a-z0-9-]*)?\\b${words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'gim',
  );
  out = out.replace(rawSlug, (match, guard) => {
    // Inside a URL, an image path or a slug list: leave it exactly as it is.
    if (guard !== undefined) return match;
    if (match === name) return match;
    // Already properly capitalised somewhere in the copy: leave it.
    if (match !== match.toLowerCase()) return match;
    stats.slugLeaksFixed++;
    return name;
  });

  return out;
}

/* ------------------------------------------------- intra-file duplication */

/**
 * The generator pasted the same "shared facts" paragraphs under two different
 * headings in the same file, and sometimes repeated a sentence three times inside
 * one paragraph. Keep the first occurrence, drop the rest.
 */
function dedupeWithinFile(body, stats) {
  // Repeated sentences inside a single paragraph.
  let out = body.replace(/([^\n]{40,}?[.!?])(\s+\1)+/g, (m, first) => {
    stats.intraFileDupes++;
    return first;
  });

  // Repeated whole paragraphs anywhere in the file.
  const blocks = out.split('\n\n');
  const seen = new Set();
  const kept = blocks.filter((block) => {
    const key = block.trim();
    // Headings, tables, lists and components legitimately repeat their shape.
    if (key.length < 60 || /^[#|<>-]/.test(key)) return true;
    if (seen.has(key)) {
      stats.intraFileDupes++;
      return false;
    }
    seen.add(key);
    return true;
  });
  return kept.join('\n\n');
}

/**
 * The generator's "shared facts" block — nine sentences pasted verbatim into 30-40
 * files, twice per file. Each is true in general and several are wrong in place: the
 * Riviera Maya lodging-tax line lands on Los Cabos pages, the Quintana Roo HOA range
 * lands on Puerto Vallarta pages.
 *
 * Every one of them is covered in more depth on a canonical guide, so they are
 * replaced by links to those guides. That removes ~250 words of duplicated body copy
 * per page and adds an internal link where there was restated text.
 */
const SHARED_FACTS = [
  { re: /^USD\/MXN moves of 5–10% in a year can shift your effective entry price[^\n]*$/gm, to: 'currency-risk-mexico-property-usd', label: 'USD/MXN exposure' },
  { re: /^HOA fees in Quintana Roo often run \$0\.80–\$2\.50 per m² monthly[^\n]*$/gm, to: 'hoa-fees-mexico-condo', label: 'HOA fees' },
  { re: /^Closing costs typically land at 5–8% of price for buyers[^\n]*$/gm, to: 'cost-of-buying-property-mexico', label: 'closing costs' },
  { re: /^Budget 6–8% closing stack on top of price\.$/gm, to: 'cost-of-buying-property-mexico', label: 'closing costs' },
  { re: /^ISH lodging tax and municipal STR registration apply in most Riviera Maya markets[^\n]*$/gm, to: 'quintana-roo-lodging-tax-registration-guide', label: 'lodging tax and STR registration' },
  { re: /^STR permission must be confirmed in writing from HOA\.$/gm, to: 'short-term-rental-rules-riviera-maya', label: 'STR permission' },
  { re: /^Fideicomiso renewals every 50 years carry bank fees[^\n]*$/gm, to: 'bank-trust-renewal-mexico', label: 'fideicomiso renewal' },
  { re: /^Ejido-adjacent listings at steep discounts usually carry title risk[^\n]*$/gm, to: 'ejido-land-risks-mexico', label: 'ejido title risk' },
  { re: /^Pre-construction buyers should confirm developer track record on two prior delivered projects[^\n]*$/gm, to: 'developer-due-diligence-mexico', label: 'developer track record' },
  { re: /^Compare hurricane insurance and maintenance reserves vs your home country\.$/gm, to: 'mexico-property-insurance-foreigners', label: 'insurance and reserves' },
];

const SLOT = '@@SHARED_FACT_SLOT@@';

function replaceSharedFacts(body, stats, selfSlug) {
  let out = body;
  const linked = new Map();
  for (const { re, to, label } of SHARED_FACTS) {
    let hit = false;
    out = out.replace(re, () => {
      hit = true;
      stats.sharedFactsReplaced++;
      return SLOT;
    });
    // Never link a page to itself.
    if (hit && to !== selfSlug) linked.set(to, label);
  }
  if (!out.includes(SLOT)) return out;

  const rail = linked.size
    ? 'Verify before you commit: ' +
      [...linked].map(([slug, label]) => `[${label}](/guides/${slug}/)`).join(' \u00b7 ') +
      '.'
    : '';

  // The first slot becomes the link rail; the rest disappear.
  let first = true;
  return out.split(SLOT).reduce((acc, part, i) => {
    if (i === 0) return part;
    if (first && rail) {
      first = false;
      return acc + rail + part;
    }
    return acc + part;
  }, '');
}

/** A heading whose whole section is now empty carries no information. */
function dropEmptySections(body, stats) {
  let out = body;
  let changed = true;
  // Iterate: dropping one empty heading can leave the one above it empty too.
  while (changed) {
    changed = false;
    out = out.replace(/(^|\n)(#{2,4} [^\n]+)\n+(?=(?:#{2,4} |<FaqBlock|<CtaBox|---\s*\n)|\s*$)/g, (m, lead) => {
      stats.emptySectionsDropped++;
      changed = true;
      return lead;
    });
  }
  return out;
}

/* ------------------------------------------------------------- whitespace */

function tidy(body) {
  return (
    body
      // A heading or table glued straight onto the previous line.
      .replace(/([^\n])\n(#{2,4} )/g, '$1\n\n$2')
      .replace(/([^\n|])\n(\|)/g, '$1\n\n$2')
      // Leftover separators from removed blocks.
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\n---\n\n(?=\n*---\n)/g, '\n\n')
      .replace(/(?:\n\n---)+\n\n(?=<FaqBlock)/g, '\n\n')
      .replace(/\n\n---\s*$/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .trimEnd() + '\n'
  );
}

/* -------------------------------------------------------------- per file */

function wordsIn(text) {
  return text.replace(/^\|.*$/gm, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Body of the section starting at `headingRe`, up to the next H2 or component. */
function sectionRange(body, headingRe) {
  const m = body.match(headingRe);
  if (!m) return null;
  const start = m.index;
  const after = body.slice(start + m[0].length);
  const nextH2 = after.search(/\n## /);
  const nextComponent = after.search(/\n<(?:FaqBlock|CtaBox)/);
  const candidates = [nextH2, nextComponent].filter((i) => i >= 0);
  const end = candidates.length ? start + m[0].length + Math.min(...candidates) : body.length;
  return { start, end, heading: m[0], inner: body.slice(start + m[0].length, end) };
}

function processFile(abs, stats) {
  const raw = fs.readFileSync(abs, 'utf8');
  const fmMatch = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) return null;
  const [, frontmatter, original] = fmMatch;
  let body = original;

  const entry = {
    slug: path.basename(abs).replace(/\.mdx?$/, ''),
    collection: path.basename(path.dirname(abs)),
    title: (frontmatter.match(/^title:\s*["']?(.*?)["']?\s*$/m) ?? [, ''])[1],
  };

  const before = wordsIn(body);

  for (const re of SENTENCES) body = body.replace(re, '');
  for (const re of LINES) body = body.replace(re, '');
  body = body.replace(BENCHMARK_TABLE, '');

  // Collapse paragraphs that removals emptied out.
  body = body
    .split('\n\n')
    .filter((block, i, arr) => block.trim().length > 0 || i === arr.length - 1)
    .join('\n\n');

  // Appended GEO sections: drop when nothing substantive survives.
  for (const headingRe of APPENDED_SECTIONS) {
    const range = sectionRange(body, headingRe);
    if (!range) continue;
    if (wordsIn(range.inner) < SECTION_KEEP_MIN_WORDS) {
      body = body.slice(0, range.start) + body.slice(range.end);
      stats.sectionsDropped++;
    } else {
      stats.sectionsKept++;
      stats.keptSections.push(path.relative(ROOT, abs));
    }
  }

  body = rewriteHeadings(body, stats);
  body = fixSlugLeak(body, entry, stats);
  body = replaceSharedFacts(body, stats, entry.slug);
  body = dedupeWithinFile(body, stats);
  body = dropEmptySections(body, stats);
  body = tidy(body);

  // FAQ questions live in frontmatter and carry the same lower-cased slug
  // ("How much does gran tulum cost?"). Only the faq block is touched.
  const fixedFm = frontmatter.replace(/^(\s+-?\s*(?:question|answer):\s*)(.*)$/gm, (line, lead, value) =>
    lead + fixSlugLeak(value, entry, stats),
  );

  const after = wordsIn(body);
  if (body === original && fixedFm === frontmatter) return null;
  return { frontmatter: fixedFm, body, before, after, abs };
}

/* ------------------------------------------------------------------- run */

const stats = {
  files: 0,
  changed: 0,
  wordsBefore: 0,
  wordsAfter: 0,
  headingsRestored: 0,
  slugLeaksFixed: 0,
  intraFileDupes: 0,
  sharedFactsReplaced: 0,
  emptySectionsDropped: 0,
  sectionsDropped: 0,
  sectionsKept: 0,
  keptSections: [],
  thin: [],
};

for (const collection of COLLECTIONS) {
  if (only && collection !== only) continue;
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    if (oneFile && !file.startsWith(oneFile)) continue;
    stats.files++;
    const result = processFile(path.join(dir, file), stats);
    if (!result) continue;
    stats.changed++;
    stats.wordsBefore += result.before;
    stats.wordsAfter += result.after;
    if (result.after < 1200) stats.thin.push(`${collection}/${file.replace(/\.mdx?$/, '')} (${result.after}w)`);
    if (!DRY) fs.writeFileSync(result.abs, result.frontmatter + result.body);
  }
}

const removed = stats.wordsBefore - stats.wordsAfter;
console.log(`\n=== CORPUS BOILERPLATE REMOVAL ${DRY ? '(dry run)' : ''} ===`);
console.log(`Files scanned:      ${stats.files}`);
console.log(`Files changed:      ${stats.changed}`);
console.log(`Words before:       ${stats.wordsBefore.toLocaleString()}`);
console.log(`Words after:        ${stats.wordsAfter.toLocaleString()}`);
console.log(`Boilerplate removed:${removed.toLocaleString()} (${Math.round((removed / (stats.wordsBefore || 1)) * 100)}%)`);
console.log(`Headings restored:  ${stats.headingsRestored}`);
console.log(`Raw slug leaks fixed: ${stats.slugLeaksFixed}`);
console.log(`Intra-file duplicates removed: ${stats.intraFileDupes}`);
console.log(`Shared-fact paragraphs replaced with links: ${stats.sharedFactsReplaced}`);
console.log(`Emptied sections dropped: ${stats.emptySectionsDropped}`);
console.log(`Appended sections dropped: ${stats.sectionsDropped}`);
console.log(`Appended sections kept (had real content): ${stats.sectionsKept}`);
if (stats.keptSections.length) {
  console.log('  kept in:');
  for (const f of [...new Set(stats.keptSections)].slice(0, 20)) console.log(`    ${f}`);
  if (new Set(stats.keptSections).size > 20) console.log(`    ... and ${new Set(stats.keptSections).size - 20} more`);
}
if (stats.thin.length) {
  console.log(`\nThin after cleanup (<1200 words) — need the hand-written pass: ${stats.thin.length}`);
  for (const f of stats.thin.slice(0, 30)) console.log(`    ${f}`);
  if (stats.thin.length > 30) console.log(`    ... and ${stats.thin.length - 30} more`);
}
console.log('');
