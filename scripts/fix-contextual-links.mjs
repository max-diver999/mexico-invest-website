#!/usr/bin/env node
/**
 * Weave curated links into the prose that mentions them.
 *
 * Removing the hand-written "Related guides" lists left 25 pages with fewer than five
 * in-body internal links. Putting the list back would restore the duplication; the
 * right fix is the one an editor would make — link the phrase in the text where the
 * subject actually comes up.
 *
 * For each relatedSlug the page does not already link, this finds the first mention of
 * that target's subject in an ordinary paragraph and links it. Nothing is inserted:
 * if the page never mentions the subject, no link is made and the page is reported.
 *
 * Usage: node scripts/fix-contextual-links.mjs [--dry] [--min=5]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const MIN_LINKS = Number((argv.find((a) => a.startsWith('--min=')) ?? '').split('=')[1]) || 5;

/**
 * Anchor phrases per target, chosen so the link lands on wording the page already
 * uses. Deriving them from the title does not work — "Fideicomiso Mexico 2026" is a
 * headline, "the fideicomiso" is what the prose says — so the phrasing for the pages
 * that get linked most is written out here.
 *
 * Order matters: the most specific phrase is tried first.
 */
const ANCHORS = {
  'mexico-rental-yield-guide': ['net rental yield', 'net yield', 'rental yield'],
  'due-diligence-mexico-real-estate': ['due diligence checklist', 'due diligence'],
  'riviera-maya-property-investment-guide': ['Riviera Maya corridor', 'Riviera Maya'],
  'fideicomiso-mexico-explained': ['fideicomiso bank trust', 'bank trust', 'fideicomiso'],
  'mexico-property-investment-guide': ['Mexican property market', 'Mexico property investment'],
  'buy-property-mexico-foreigner': ['foreign buyers', 'foreign buyer'],
  'los-cabos-property-investment-guide': ['Los Cabos'],
  'cost-of-buying-property-mexico': ['closing costs', 'closing cost'],
  'airbnb-investment-mexico-guide': ['short-term rental', 'Airbnb'],
  'puerto-vallarta-property-investment-guide': ['Puerto Vallarta'],
  'mexico-property-for-americans': ['US buyers', 'American buyers'],
  'mexico-property-for-canadians': ['Canadian buyers'],
  'pre-construction-mexico-risks': ['pre-construction risk', 'pre-construction'],
  'can-foreigners-buy-property-mexico': ['restricted zone'],
  'developer-due-diligence-mexico': ['developer track record', 'developer due diligence'],
  'short-term-rental-rules-riviera-maya': ['STR permit', 'municipal STR', 'short-term rental rules'],
  'mexico-capital-gains-tax-foreign-seller': ['capital gains', 'ISR on the sale'],
  'escrow-mexico-real-estate': ['escrow account', 'escrow'],
  'gross-vs-net-yield-mexico': ['gross yield'],
  'us-taxes-mexico-rental-property': ['US tax return', 'US taxes'],
  'mexico-real-estate-scams-avoid': ['common scams', 'fraud'],
  'notario-publico-mexico-property-role': ['notario público', 'notario'],
  'sat-rental-registration-mexico': ['SAT registration', 'register with SAT'],
  'ejido-land-risks-mexico': ['ejido land', 'ejido'],
  'property-management-riviera-maya-cost': ['property management fee', 'property manager', 'property management'],
  'hoa-fees-mexico-condo': ['HOA fees', 'HOA fee'],
  'mexico-property-insurance-foreigners': ['property insurance', 'insurance cover'],
  'mexico-property-taxes-explained': ['property taxes', 'predial'],
  'non-resident-mortgage-mexico': ['non-resident mortgage', 'mortgage'],
  'cross-border-lender-list': ['cross-border lender', 'cross-border lending'],
  'power-of-attorney-property-mexico': ['power of attorney'],
  'translation-requirements-mexico-deed': ['certified translation', 'translation'],
  'closing-timeline-mexico-30-90-days': ['closing timeline'],
  'apostille-documents-mexico-property': ['apostille'],
  'non-resident-tax-id-rfc-guide': ['RFC registration', 'RFC'],
  'cfdi-cost-basis-mexico': ['CFDI'],
  'vat-mexico-property-rental': ['lodging VAT', 'IVA'],
  'repatriate-sale-proceeds-mexico': ['repatriate', 'sale proceeds'],
  'how-to-sell-mexico-property-from-abroad': ['when you sell', 'selling from abroad'],
  'quintana-roo-lodging-tax-registration-guide': ['lodging tax', 'ISH'],
  'bank-trust-renewal-mexico': ['trust renewal', '50-year term'],
  'title-insurance-mexico': ['title insurance'],
  'wire-fraud-mexico-closing': ['wire fraud'],
  'fideicomiso-vs-mexican-corporation': ['Mexican corporation'],
  'inheritance-property-mexico-foreigner': ['inheritance', 'substitute beneficiary'],
  'best-areas-invest-mexico-2026': ['best areas', 'where to buy'],
  'mexico-restricted-zone-explained': ['50 km of the coast', 'restricted zone'],
  'hurricane-flood-insurance-quintana-roo': ['hurricane insurance', 'hurricane cover'],
  'earthquake-risk-mexico-property': ['seismic risk', 'earthquake risk'],
  'flood-risk-riviera-maya': ['flood risk'],
  'ampi-license-verify-guide': ['AMPI licence', 'AMPI'],
  'unregistered-broker-mexico': ['unlicensed broker', 'unregistered broker'],
  'mexico-off-plan-investment': ['off-plan'],
  'tulum': ['Tulum'],
  'playa-del-carmen': ['Playa del Carmen'],
  'cancun': ['Cancún', 'Cancun'],
  'cabo-corridor': ['the Corridor', 'Cabo corridor'],
  'cabo-san-lucas': ['Cabo San Lucas'],
  'san-jose-del-cabo': ['San José del Cabo'],
  'nuevo-vallarta': ['Nuevo Vallarta'],
  'aldea-zama-tulum': ['Aldea Zama'],
  'puerto-morelos': ['Puerto Morelos'],
  'puerto-vallarta': ['Puerto Vallarta'],
  'merida': ['Mérida'],
};

/** Index every routable entry, preferring a written anchor over a derived one. */
const index = new Map();
for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const slug = file.replace(/\.mdx?$/, '');
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const title = (raw.match(/^title:\s*["']?(.*?)["']?\s*$/m) ?? [, ''])[1];
    const subject = title.split(':')[0]
      .replace(/\s+(?:Review|Guide|Investment Guide|Real Estate|Developer Profile)\b.*$/i, '')
      .replace(/\s+20\d\d$/, '')
      .trim();
    const derived = [subject, slug.replace(/-/g, ' ')]
      .filter((p) => p.split(/\s+/).length >= 2 && p.length >= 10);
    const phrases = [...new Set([...(ANCHORS[slug] ?? []), ...derived])];
    index.set(slug, { collection, slug, title, url: `/${collection}/${slug}/`, phrases });
  }
}

function bodyLinkCount(body) {
  return [...body.matchAll(/\]\(\/[a-z0-9-]+\//g)].length;
}

/** Paragraph lines that can carry a link: not headings, tables, lists, JSX or images. */
function isProse(line) {
  return (
    line.trim().length > 80 &&
    !/^[#|>\-*\s]/.test(line) &&
    !/^</.test(line.trim()) &&
    !/^!\[/.test(line.trim()) &&
    !/^\*[^*]/.test(line.trim())
  );
}

let filesChanged = 0;
let linksAdded = 0;
const unresolved = [];

for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const m = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) continue;
    const [, frontmatter, original] = m;
    let body = original;
    if (bodyLinkCount(body) >= MIN_LINKS) continue;

    const selfSlug = file.replace(/\.mdx?$/, '');
    const fmRelated = frontmatter.match(/^relatedSlugs:\s*\n((?:\s+-\s.*\n)*)/m);
    const related = fmRelated
      ? fmRelated[1].split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : [];

    const lines = body.split('\n');
    let added = 0;
    const missed = [];

    for (const targetSlug of related) {
      if (bodyLinkCount(lines.join('\n')) >= MIN_LINKS) break;
      const target = index.get(targetSlug);
      if (!target || targetSlug === selfSlug) continue;
      if (lines.join('\n').includes(target.url)) continue;

      let done = false;
      for (const phrase of target.phrases) {
        const re = new RegExp(`(?<!\\[)\\b(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^\\[]*\\])`, 'i');
        for (let i = 0; i < lines.length; i++) {
          if (!isProse(lines[i])) continue;
          // Never link inside an existing link or an image alt.
          if (/\]\(/.test(lines[i]) && lines[i].split('](').length > 3) continue;
          if (!re.test(lines[i])) continue;
          lines[i] = lines[i].replace(re, `[$1](${target.url})`);
          added++;
          linksAdded++;
          done = true;
          break;
        }
        if (done) break;
      }
      if (!done) missed.push(targetSlug);
    }

    if (!added) {
      unresolved.push(`${collection}/${selfSlug}: ${bodyLinkCount(body)} links, no phrase match for ${missed.slice(0, 3).join(', ')}`);
      continue;
    }
    body = lines.join('\n');
    if (bodyLinkCount(body) < MIN_LINKS) {
      unresolved.push(`${collection}/${selfSlug}: still ${bodyLinkCount(body)} links after ${added} added`);
    }
    filesChanged++;
    if (!DRY) fs.writeFileSync(abs, frontmatter + body);
  }
}

console.log(`\n=== CONTEXTUAL LINKS ${DRY ? '(dry run)' : ''} ===`);
console.log(`Files changed: ${filesChanged} | links woven into prose: ${linksAdded}`);
if (unresolved.length) {
  console.log(`\nStill short of ${MIN_LINKS} — needs a human link: ${unresolved.length}`);
  for (const u of unresolved) console.log('  ' + u);
}
console.log('');
