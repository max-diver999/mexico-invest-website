#!/usr/bin/env node
/**
 * Sanity-check yield and occupancy claims against what the corpus itself models.
 *
 * The generator produced figures that are arithmetically impossible next to the
 * numbers on the same page — "18-19% gross" beside "4.5% net after 25-35%
 * management", or "95%+ occupancy" for nightly rental in a market the rest of the
 * site models at 68-78%. Those survive every other gate because each number is
 * individually well-formed.
 *
 * Bounds come from the corpus's own worked models, not from an outside source:
 *   gross STR yield   4-12%   (Playa 6.6%, Cabos 6.3%, Tulum 6-7%)
 *   net STR yield     1.5-7%  (best documented anywhere in the corpus: 5.2%)
 *   STR occupancy     35-85%  (peak months reach 88%; annual never approaches 95%)
 *
 * A figure outside those bands is not automatically wrong — a single peak week or
 * an annual lease legitimately sits outside them — so the check reports context
 * and asks for a human read rather than failing the build.
 *
 * Usage: node scripts/qa-yield-sanity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

/** Wording that legitimately carries a high number: peak weeks, annual leases. */
const EXEMPT = /\b(on annual leases|annual-lease|stress-?test|model net yield at|who demand|management\s*(?:contract|fee)?|STR management|full-service|fee range|gross revenue for|developer (?:estimates?|projection)|peak|high season|tournament|event|holiday week|annual lease|long-?term (?:lease|occupancy|rental)|LTR|coverage|financed|LTV|down payment|withhold|tax|ISR|IVA|commission|management (?:fee|rate)|split)\b/i;

const CHECKS = [
  // "6.6% gross" / "gross yield 6.6%" — the number must sit against the label with
  // nothing in between, so "net yield after 25-30% management" does not match.
  { label: 'gross yield', re: /\b(\d{1,2}(?:\.\d)?)\s*%\s*gross\b(?!\s*(?:withholding|method))|\bgross\s*(?:STR\s*)?yields?\s*(?:of|near|range|runs?|at)?\s*(\d{1,2}(?:\.\d)?)\s*%/gi, min: 3, max: 12 },
  { label: 'net yield', re: /\b(\d{1,2}(?:\.\d)?)\s*%\s*net\b(?!\s*(?:gain|method))|\bnet\s*yields?\s*(?:of|near|range|runs?|at|around)?\s*(\d{1,2}(?:\.\d)?)\s*%/gi, min: 1.5, max: 7 },
  { label: 'occupancy', re: /\b(\d{2,3})\s*%\+?\s*(?:annual\s*)?occupancy\b|\boccupancy\s*(?:of|near|at|around)?\s*(\d{2,3})\s*%/gi, min: 30, max: 88 },
];

let flagged = 0;
for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const check of CHECKS) {
      for (const m of raw.matchAll(check.re)) {
        const nums = m.slice(1).filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
        if (!nums.length) continue;
        const worst = Math.max(...nums);
        const lowest = Math.min(...nums);
        if (worst <= check.max && lowest >= check.min) continue;
        const line = raw.slice(0, m.index).split('\n').length;
        const context = raw.slice(Math.max(0, m.index - 90), m.index + 90).replace(/\n/g, ' ');
        if (EXEMPT.test(context)) continue;
        flagged++;
        console.log(`  ${collection}/${file.replace(/\.mdx?$/, '')}:${line} [${check.label}] ${JSON.stringify(context.trim())}`);
      }
    }
  }
}

// --- Arithmetic consistency -------------------------------------------------
// A stated gross percentage that contradicts the dollar figure in the same table
// row is not a judgement call, it is wrong. Holbox shipped "$56,210 | ~14% gross"
// against a $295K basis (really 19.1%) and Palmilla shipped an "8-12% gross" row
// whose own rate x nights produced 24%. Both survived every gate because each
// number was individually plausible. These fail the build.
const mismatches = [];
const BASIS_RE = /(?:on|against)\s+\$?([\d.]+)\s*([KM])\b|\$?([\d,]{6,})\s+all-in/i;

for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = raw.split('\n');
    let basis = null;
    lines.forEach((line, idx) => {
      if (!line.trim().startsWith('|')) { if (!/^\s*$/.test(line)) basis = null; return; }
      const head = BASIS_RE.exec(line);
      if (head) {
        const val = head[1] ? Number(head[1]) * (head[2].toUpperCase() === 'M' ? 1e6 : 1e3)
                            : Number(head[3].replace(/,/g, ''));
        if (val >= 50000) basis = val;
      }
      if (!basis) return;
      const money = /\$([\d,]{5,})/.exec(line);
      const pct = /~?\s*([\d.]+)\s*%\s*gross/i.exec(line);
      if (!money || !pct) return;
      const dollars = Number(money[1].replace(/,/g, ''));
      const stated = Number(pct[1]);
      const actual = (dollars / basis) * 100;
      if (Math.abs(actual - stated) > Math.max(1.5, stated * 0.15)) {
        mismatches.push(
          `  ${collection}/${file.replace(/\.mdx?$/, '')}:${idx + 1} states ${stated}% gross, ` +
          `but $${dollars.toLocaleString()} on a $${basis.toLocaleString()} basis is ${actual.toFixed(1)}%`
        );
      }
    });
  }
}

if (mismatches.length) {
  console.log('\n=== ARITHMETIC MISMATCH (hard errors) ===');
  mismatches.forEach((m) => console.log(m));
}

console.log(`\n=== YIELD AND OCCUPANCY SANITY ===`);
console.log(flagged ? `${flagged} figures outside corpus-modelled bands — read each one` : 'No figures outside corpus-modelled bands.');

if (mismatches.length) {
  console.log(`\n❌ FAIL — ${mismatches.length} stated percentage(s) contradict their own figures.`);
  process.exit(1);
}
