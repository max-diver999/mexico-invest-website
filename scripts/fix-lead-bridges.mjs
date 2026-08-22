#!/usr/bin/env node
/**
 * Insert one contextual lead bridge per article.
 *
 * The audit found zero in-body links to /get-shortlist/ or /contact/ across all 337
 * pages: every CTA was layout furniture — a form at the top, a box in the footer, a
 * sticky bar. Nothing sat at the point in the argument where a reader has just learned
 * something that creates a next step.
 *
 * One bridge per page, placed after the section that earns it, worded for what that
 * page is about. Tax pages go to /contact/ because the next step is an advisor; market
 * and project pages go to /get-shortlist/ because the next step is options.
 *
 * Idempotent: a file that already contains a CtaBox is left alone.
 *
 * Usage: node scripts/fix-lead-bridges.mjs [--dry] [--only=guides]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_CLUSTERS } from './lib/guide-clusters.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'developers'];

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const only = (argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1];

/**
 * Bridge copy per cluster. Each one is a next step the page has just made relevant,
 * not a generic ask. `href` decides which funnel: an advisor introduction or a
 * shortlist of properties.
 */
const BRIDGES = {
  tax: {
    title: 'Need this run against your actual numbers?',
    description:
      'Cross-border tax on a Mexican property is where generic advice gets expensive. Tell us the purchase, the rental position and where you file, and we will introduce a CPA who has filed this combination before.',
    buttonText: 'Ask for an introduction →',
    href: '/contact/',
  },
  fideicomiso: {
    title: 'Want the trust quote for your specific purchase?',
    description:
      'Bank fee schedules differ by institution and by declared value, and the spread compounds over a hold measured in decades. Tell us the property and the budget, and we will come back with what the structure actually costs on it.',
    buttonText: 'Get the cost breakdown →',
    href: '/get-shortlist/',
  },
  str: {
    title: 'Want the permit position checked before you offer?',
    description:
      'Whether a unit can be rented nightly comes down to the condominium regime, the HOA minutes and the municipal register, not the listing. Send us the building and we will tell you what we can verify.',
    buttonText: 'Check the permit position →',
    href: '/contact/',
  },
  process: {
    title: 'Want a second pair of eyes before you sign?',
    description:
      'Most of what goes wrong in a Mexican purchase goes wrong in the paperwork, and it is cheap to catch early. Tell us where you are in the process and we will tell you what we would want to see in writing.',
    buttonText: 'Talk it through →',
    href: '/contact/',
  },
  risk: {
    title: 'Not sure whether this applies to the property you are looking at?',
    description:
      'Title, hazard and permit risk are property-specific, and the difference between two buildings on the same street can be the whole deal. Send us the address and what you have been shown.',
    buttonText: 'Ask us to look →',
    href: '/contact/',
  },
  finance: {
    title: 'Want the financing options priced for your position?',
    description:
      'Non-resident lending terms in Mexico vary sharply by nationality, property type and how the purchase is structured. Tell us the budget and the market, and we will come back with what is realistically available.',
    buttonText: 'See the options →',
    href: '/get-shortlist/',
  },
  market: {
    title: 'Want three options here with the numbers run?',
    description:
      'Tell us the budget and what the money is for. We come back with three to five properties in this market, net yield rebuilt after HOA, management, lodging tax and vacancy — including the ones we would not buy.',
    buttonText: 'Get your shortlist →',
    href: '/get-shortlist/',
  },
  project: {
    title: 'Want three comparable buildings run the same way?',
    description:
      'One project only means something next to its alternatives. Tell us the budget and we will come back with comparable stock in the same corridor, on the same net yield maths, plus what we would ask this developer in writing.',
    buttonText: 'Compare the alternatives →',
    href: '/get-shortlist/',
  },
  developer: {
    title: 'Checking this developer before a deposit?',
    description:
      'Send us the project and the payment schedule on the table. We will come back with what we can verify about prior deliveries in that municipality, and what belongs in writing before any money moves.',
    buttonText: 'Ask before you deposit →',
    href: '/contact/',
  },
};

/** Guide cluster label -> bridge key. */
const CLUSTER_BRIDGE = {
  'Start here': 'market',
  'Fideicomiso and the restricted zone': 'fideicomiso',
  'The buying process': 'process',
  'Mexican tax: ISR, IVA, RFC, CFDI, predial': 'tax',
  'US and Canadian tax on a Mexican property': 'tax',
  'Short-term rental: permits, tax, operations': 'str',
  'Yield, costs and carrying': 'market',
  'Financing and currency': 'finance',
  'Risk: title, hazard, fraud': 'risk',
  'Selling and getting paid': 'tax',
  'Markets and property types': 'market',
  'Buyer profiles and budgets': 'market',
};

const guideBridge = new Map();
for (const cluster of GUIDE_CLUSTERS) {
  const key = CLUSTER_BRIDGE[cluster.label] ?? 'market';
  for (const slug of cluster.slugs) guideBridge.set(slug, key);
}

function bridgeFor(collection, slug) {
  if (collection === 'guides') return BRIDGES[guideBridge.get(slug) ?? 'market'];
  if (collection === 'projects') return BRIDGES.project;
  if (collection === 'developers') return BRIDGES.developer;
  return BRIDGES.market; // areas, compare
}

function render(bridge) {
  return `<CtaBox
  title="${bridge.title}"
  description="${bridge.description}"
  buttonText="${bridge.buttonText}"
  href="${bridge.href}"
/>`;
}

/**
 * Place the bridge at the H2 boundary closest to 60% of the way down the body —
 * far enough in that the reader has been given something, early enough that they
 * have not already reached the footer form.
 */
function insertionPoint(body) {
  const positions = [...body.matchAll(/^## /gm)].map((m) => m.index);
  if (positions.length < 3) return -1;
  const faq = body.search(/^<FaqBlock/m);
  const limit = faq > 0 ? faq : body.length;
  const usable = positions.filter((i) => i < limit);
  if (usable.length < 3) return -1;
  const target = limit * 0.6;
  let best = usable[1];
  for (const pos of usable.slice(1, -1)) {
    if (Math.abs(pos - target) < Math.abs(best - target)) best = pos;
  }
  return best;
}

let changed = 0;
let skipped = 0;
const byBridge = {};

for (const collection of COLLECTIONS) {
  if (only && collection !== only) continue;
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const m = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) continue;
    let [, frontmatter, body] = m;

    if (/<CtaBox/.test(body)) {
      skipped++;
      continue;
    }

    const at = insertionPoint(body);
    if (at < 0) {
      skipped++;
      continue;
    }

    const slug = file.replace(/\.mdx?$/, '');
    const bridge = bridgeFor(collection, slug);
    byBridge[bridge.href] = (byBridge[bridge.href] ?? 0) + 1;

    body = body.slice(0, at) + render(bridge) + '\n\n' + body.slice(at);

    // The component has to be imported for MDX to render it.
    if (!/^import CtaBox from/m.test(body)) {
      body = body.replace(
        /^(import FaqBlock from .*)$/m,
        `$1\nimport CtaBox from '../../components/CtaBox.astro';`,
      );
    }
    if (!/^import CtaBox from/m.test(body)) {
      skipped++;
      continue;
    }

    changed++;
    if (!DRY) fs.writeFileSync(abs, frontmatter + body);
  }
}

console.log(`\n=== LEAD BRIDGES ${DRY ? '(dry run)' : ''} ===`);
console.log(`Bridges inserted: ${changed}`);
console.log(`Skipped (already had one, or too short to place): ${skipped}`);
console.log(`Split by funnel: ${JSON.stringify(byBridge)}\n`);
