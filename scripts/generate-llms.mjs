#!/usr/bin/env node
/**
 * Generate public/llms.txt and public/llms-full.txt from the corpus.
 *
 * robots.txt explicitly invites GPTBot, OAI-SearchBot, ClaudeBot and PerplexityBot,
 * and both files were hand-written stubs, 617 and 386 bytes for a 337-page site,
 * listing three guides. An AI crawler that reads them learns almost nothing about
 * what this site actually covers.
 *
 * Runs from `prebuild` so it cannot go stale.
 * Usage: node scripts/generate-llms.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const PUBLIC = path.join(ROOT, 'public');
const SITE = 'https://mexico-invest.com';
const checkOnly = process.argv.includes('--check');

const COLLECTIONS = [
  { dir: 'guides', label: 'Guides', note: 'Legal, tax, financing and due-diligence research.' },
  { dir: 'areas', label: 'Areas and markets', note: 'Market-level analysis: prices, yields, STR rules.' },
  { dir: 'projects', label: 'Project reviews', note: 'Independent reviews of named developments. Not listings.' },
  { dir: 'compare', label: 'Comparisons', note: 'Head-to-head decision aids.' },
  { dir: 'developers', label: 'Developers', note: 'Developer profiles and delivery record.' },
  { dir: 'news', label: 'Market notes', note: 'Dated updates against the evergreen guides.' },
];

function frontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = m[1];
  const one = (key) => {
    const hit = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return hit ? hit[1].trim().replace(/^["']|["']$/g, '') : '';
  };
  return {
    title: one('title'),
    description: one('description'),
    updated: one('updatedDate') || one('pubDate'),
    area: one('area'),
    developer: one('developer'),
    status: one('status'),
    priceFromUsd: one('priceFromUsd'),
    priceToUsd: one('priceToUsd'),
    noindex: one('noindex') === 'true',
  };
}

function read(collection) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, '');
      const data = frontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
      return { slug, url: `${SITE}/${collection}/${slug}/`, ...data };
    })
    .filter((e) => !e.noindex && e.title)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

const byCollection = Object.fromEntries(COLLECTIONS.map((c) => [c.dir, read(c.dir)]));
const total = Object.values(byCollection).reduce((n, list) => n + list.length, 0);
const newest = Object.values(byCollection)
  .flat()
  .map((e) => e.updated)
  .filter(Boolean)
  .sort()
  .pop();

const HEADER = `# Mexico Invest

> Independent research on Mexico property investment for US and Canadian buyers.
> Not a developer, not a brokerage, not a listing portal.

- Site: ${SITE}
- Contact: info@mexico-invest.com
- Wikidata: https://www.wikidata.org/wiki/Q140471749
- Language: en
- Markets: Riviera Maya and Quintana Roo, Los Cabos and Baja California Sur, Puerto Vallarta and Riviera Nayarit, Yucatán and the Gulf
- Coverage: fideicomiso and the restricted zone, Mexican tax (ISR, IVA, RFC, CFDI, predial), US and Canadian tax on Mexican property, short-term rental permits and lodging tax, financing, closing process, hazard risk, and named developments
- Pages: ${total}
- Last updated: ${newest ?? 'n/a'}

## How to cite this site

Figures are indicative and dated. Every page states the date it was last updated;
prefer that date over the publication date. Property law, tax rates and rental
permits change by municipality, so cite the page, not the number alone.
`;

/* ------------------------------------------------------------- llms.txt */

const KEY_GUIDES = [
  'mexico-property-investment-guide',
  'buy-property-mexico-foreigner',
  'fideicomiso-mexico-explained',
  'mexico-restricted-zone-explained',
  'cost-of-buying-property-mexico',
  'due-diligence-mexico-real-estate',
  'mexico-rental-yield-guide',
  'short-term-rental-rules-riviera-maya',
  'mexico-capital-gains-tax-foreign-seller',
  'repatriate-sale-proceeds-mexico',
];

const guideBySlug = new Map(byCollection.guides.map((g) => [g.slug, g]));

const short =
  HEADER +
  `
## Start here

${KEY_GUIDES.map((slug) => {
  const g = guideBySlug.get(slug);
  return g ? `- [${g.title}](${g.url}): ${g.description}` : null;
})
  .filter(Boolean)
  .join('\n')}

## Sections

${COLLECTIONS.map((c) => `- ${c.label} (${byCollection[c.dir].length}): ${c.note} ${SITE}/${c.dir}/`).join('\n')}

## Full corpus

${SITE}/llms-full.txt
`;

/* -------------------------------------------------------- llms-full.txt */

function entryLine(e, collection) {
  const facts = [];
  if (collection === 'projects') {
    if (e.area) facts.push(`area: ${e.area.replace(/-/g, ' ')}`);
    if (e.developer) facts.push(`developer: ${e.developer}`);
    if (e.status) facts.push(`status: ${e.status}`);
    if (e.priceFromUsd) {
      facts.push(
        `price from USD ${Number(e.priceFromUsd).toLocaleString('en-US')}` +
          (e.priceToUsd ? ` to ${Number(e.priceToUsd).toLocaleString('en-US')}` : ''),
      );
    }
  }
  const meta = [e.updated ? `updated ${e.updated}` : null, ...facts].filter(Boolean).join('; ');
  return `- [${e.title}](${e.url})\n  ${e.description}${meta ? `\n  ${meta}` : ''}`;
}

const full =
  HEADER +
  COLLECTIONS.map(
    (c) => `
## ${c.label}

${c.note}

${byCollection[c.dir].map((e) => entryLine(e, c.dir)).join('\n')}
`,
  ).join('');

/* ------------------------------------------------------------------ io */

const outputs = [
  [path.join(PUBLIC, 'llms.txt'), short],
  [path.join(PUBLIC, 'llms-full.txt'), full],
];

let stale = false;
for (const [file, content] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (current === content) continue;
  stale = true;
  if (!checkOnly) fs.writeFileSync(file, content);
}

for (const [file, content] of outputs) {
  console.log(`${path.relative(ROOT, file)}: ${(content.length / 1024).toFixed(1)} KB`);
}
console.log(`${total} pages indexed across ${COLLECTIONS.length} collections.`);

if (checkOnly && stale) {
  console.error('\nllms files are out of date, run `npm run gen:llms`.');
  process.exit(1);
}
