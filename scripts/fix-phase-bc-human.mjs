#!/usr/bin/env node
/** Humanize em-dashes on Phase B+C slugs only. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EM_DASH_LIMIT,
  analyzeHumanSignals,
  humanizeBodyLines,
  humanizeFrontmatter,
  forceUnderEmLimit,
  parseMdx,
} from './lib/human-signals.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLUGS = new Set([
  ...[
    'region-15-tulum', 'region-8-tulum', 'holistika-tulum', 'tulum-pueblo-east',
    'tankah-bay', 'tulum-beach-zone', 'tulum-country-club', 'puerto-aventuras',
    'cozumel-investment', 'bacalar-investment', 'north-shore-xcalacoco',
  ].map((s) => `areas/${s}`),
  ...[
    'developer-financing-mexico', 'cross-border-lender-list', 'heloc-fund-mexico-purchase',
    'seller-financing-mexico', 'mexico-construction-loan-foreigner', 'peso-mortgage-locals-only',
    'hurricane-insurance-bcs', 'flood-risk-riviera-maya', 'liability-insurance-str-mexico',
    'earthquake-risk-mexico-property', 'wire-fraud-mexico-closing', 'fake-escritura-mexico',
    'unregistered-broker-mexico', 'ampi-license-verify-guide', 'isr-exemption-5-year-rule',
    'cfdi-cost-basis-mexico', 'predial-riviera-maya-rates', 'vat-mexico-property-rental',
    'sat-rental-registration-mexico', 'non-resident-tax-id-rfc-guide',
    'closing-timeline-mexico-30-90-days', 'remote-notarization-mexico',
    'apostille-documents-mexico-property', 'translation-requirements-mexico-deed',
    'currency-closing-usd-mxn', 'repatriate-sale-proceeds-mexico',
    'land-for-sale-mexico-foreigner-risks', 'commercial-property-mexico-foreigner',
    'fractional-ownership-mexico-risks', 'timeshare-vs-condo-mexico',
  ].map((s) => `guides/${s}`),
]);

let touched = 0;
let stillHeavy = 0;

for (const rel of [...SLUGS].sort()) {
  const abs = path.join(ROOT, 'src/content', rel + '.mdx');
  if (!fs.existsSync(abs)) continue;
  const raw = fs.readFileSync(abs, 'utf8');
  let { fm, body } = parseMdx(raw);
  const coll = rel.split('/')[0];
  const emLimit = EM_DASH_LIMIT[coll] ?? 8;
  const origBody = body;
  const origFm = fm;

  const fmH = humanizeFrontmatter(fm);
  fm = fmH.fm;

  for (let pass = 0; pass < 4; pass++) {
    const { body: patched, changed } = humanizeBodyLines(body, { includeTables: true });
    body = patched;
    const after = analyzeHumanSignals(body, { emLimit });
    if (after.emPer500 <= emLimit || changed === 0) break;
  }
  let after = analyzeHumanSignals(body, { emLimit });
  if (after.emPer500 > emLimit) {
    body = forceUnderEmLimit(body, emLimit);
    after = analyzeHumanSignals(body, { emLimit });
  }

  if (body === origBody && fm === origFm) continue;
  fs.writeFileSync(abs, fm ? `---\n${fm}\n---\n${body}` : body);
  touched++;
  if (after.emPer500 > emLimit) {
    stillHeavy++;
    console.log(`still heavy ${rel}: ${after.emPer500.toFixed(1)}/500w`);
  } else {
    console.log(`humanized ${rel}`);
  }
}

console.log(`\nUpdated ${touched} files, ${stillHeavy} still over em limit`);
