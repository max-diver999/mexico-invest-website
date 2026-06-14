#!/usr/bin/env node
/**
 * Human-quality audit for Phase B+C batch (areas + C1 guides).
 * Checks: em-dash density, curly/smart quotes, broken images, HTML render issues.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeHumanSignals, EM_DASH_LIMIT } from './lib/human-signals.mjs';
import { blockedImageReason, junkImageReason } from './lib/blocked-image-sources.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mexico-invest.com';

const PHASE_BC = {
  areas: [
    'region-15-tulum',
    'region-8-tulum',
    'holistika-tulum',
    'tulum-pueblo-east',
    'tankah-bay',
    'tulum-beach-zone',
    'tulum-country-club',
    'puerto-aventuras',
    'cozumel-investment',
    'bacalar-investment',
    'north-shore-xcalacoco',
  ],
  guides: [
    'developer-financing-mexico',
    'cross-border-lender-list',
    'heloc-fund-mexico-purchase',
    'seller-financing-mexico',
    'mexico-construction-loan-foreigner',
    'peso-mortgage-locals-only',
    'hurricane-insurance-bcs',
    'flood-risk-riviera-maya',
    'liability-insurance-str-mexico',
    'earthquake-risk-mexico-property',
    'wire-fraud-mexico-closing',
    'fake-escritura-mexico',
    'unregistered-broker-mexico',
    'ampi-license-verify-guide',
    'isr-exemption-5-year-rule',
    'cfdi-cost-basis-mexico',
    'predial-riviera-maya-rates',
    'vat-mexico-property-rental',
    'sat-rental-registration-mexico',
    'non-resident-tax-id-rfc-guide',
    'closing-timeline-mexico-30-90-days',
    'remote-notarization-mexico',
    'apostille-documents-mexico-property',
    'translation-requirements-mexico-deed',
    'currency-closing-usd-mxn',
    'repatriate-sale-proceeds-mexico',
    'land-for-sale-mexico-foreigner-risks',
    'commercial-property-mexico-foreigner',
    'fractional-ownership-mexico-risks',
    'timeshare-vs-condo-mexico',
  ],
};

const SMART_QUOTE_RE = /[\u201C\u201D\u2018\u2019\u00AB\u00BB\u2033\u2032]/;
const EN_DASH_RE = /(?<! )—(?! )|—{2,}/;

function parseMdx(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return { raw, fm: m?.[1] ?? '', body: m?.[2] ?? raw };
}

function extractUrls(text) {
  const urls = [];
  for (const m of text.matchAll(/heroImage:\s*["']([^"']+)["']/g)) urls.push({ role: 'hero', url: m[1] });
  for (const m of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) urls.push({ role: 'inline', url: m[1] });
  return urls;
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'MexicoInvest-audit/1.0' },
      redirect: 'follow',
    });
    return res.status;
  } catch (e) {
    return `ERR:${e.message}`;
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MexicoInvest-audit/1.0', Accept: 'text/html' },
    redirect: 'follow',
  });
  return { status: res.status, html: res.ok ? await res.text() : '' };
}

const issues = [];

for (const [coll, slugs] of Object.entries(PHASE_BC)) {
  for (const slug of slugs) {
    const file = path.join(ROOT, 'src/content', coll, `${slug}.mdx`);
    if (!fs.existsSync(file)) {
      issues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'missing-file' });
      continue;
    }
    const { raw, fm, body } = parseMdx(file);
    const rel = `${coll}/${slug}`;

    const emLimit = EM_DASH_LIMIT[coll] ?? 8;
    const human = analyzeHumanSignals(body, { emLimit });
    for (const hi of human.issues) {
      issues.push({ severity: 'P1', slug: rel, kind: hi.kind, detail: hi.detail });
    }

    const smartInBody = (body.match(new RegExp(SMART_QUOTE_RE.source, 'g')) || []).length;
    const smartInFm = (fm.match(new RegExp(SMART_QUOTE_RE.source, 'g')) || []).length;
    if (smartInBody) issues.push({ severity: 'P1', slug: rel, kind: 'smart-quotes-body', detail: `${smartInBody} curly/smart quotes in body` });
    if (smartInFm) issues.push({ severity: 'P2', slug: rel, kind: 'smart-quotes-fm', detail: `${smartInFm} in frontmatter` });

    const badDashLines = body.split('\n').filter((l) => EN_DASH_RE.test(l) && !l.trim().startsWith('|'));
    if (badDashLines.length) {
      issues.push({ severity: 'P2', slug: rel, kind: 'em-dash-spacing', detail: `${badDashLines.length} lines with tight em-dash spacing` });
    }

    if (/Quick answer: see TL;DR below/i.test(body)) {
      issues.push({ severity: 'P1', slug: rel, kind: 'placeholder-quick-answer', detail: 'generic "see TL;DR below" stub' });
    }

    for (const { role, url } of extractUrls(raw)) {
      const blocked = blockedImageReason(url);
      const junk = junkImageReason(url);
      if (blocked) issues.push({ severity: 'P0', slug: rel, kind: 'blocked-image', detail: `${role}: ${blocked}` });
      if (junk) issues.push({ severity: 'P0', slug: rel, kind: 'junk-image', detail: `${role}: ${junk}` });
      const st = await headOk(url);
      if (st !== 200) issues.push({ severity: st === 403 ? 'P1' : 'P0', slug: rel, kind: 'image-http', detail: `${role} ${st} ${url.slice(0, 80)}` });
    }
  }
}

console.log('\n=== PHASE B+C HUMAN AUDIT (MDX) ===');
const mdxP0 = issues.filter((i) => i.severity === 'P0' && !i.kind?.startsWith('html'));
const mdxP1 = issues.filter((i) => i.severity === 'P1' && !i.kind?.startsWith('html'));
console.log(`Files: ${Object.values(PHASE_BC).flat().length}`);
console.log(`MDX P0: ${mdxP0.length} | MDX P1: ${mdxP1.length}`);
for (const i of [...mdxP0, ...mdxP1].slice(0, 40)) {
  console.log(`  [${i.severity}] ${i.slug}: ${i.kind} — ${i.detail || ''}`);
}

console.log('\n=== LIVE HTML (sample + full BC) ===');
const htmlIssues = [];
const CONCURRENCY = 8;
const tasks = [];
for (const [coll, slugs] of Object.entries(PHASE_BC)) {
  for (const slug of slugs) tasks.push({ coll, slug });
}

async function auditHtml({ coll, slug }) {
  const url = `${SITE}/${coll}/${slug}/`;
  const { status, html } = await fetchHtml(url);
  if (status !== 200) {
    htmlIssues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'http', detail: `HTTP ${status}` });
    return;
  }
  if (html.includes('id="lead-form-top"')) {
    htmlIssues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'lead-form-top', detail: 'duplicate top form' });
  }
  const lf = (html.match(/id="lead-form"/g) || []).length;
  if (lf !== 1) htmlIssues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'lead-form-count', detail: `${lf} lead forms` });
  if (/Related guide [1-9]/i.test(html)) {
    htmlIssues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'placeholder-link', detail: 'Related guide N' });
  }
  if (/(\[VERIFY|KB §|source needed)/i.test(html)) {
    htmlIssues.push({ severity: 'P0', slug: `${coll}/${slug}`, kind: 'draft-marker', detail: 'draft in HTML' });
  }
  const emInHtml = (html.match(/—/g) || []).length;
  if (emInHtml > 25) {
    htmlIssues.push({ severity: 'P1', slug: `${coll}/${slug}`, kind: 'em-dash-html', detail: `${emInHtml} em dashes in rendered page` });
  }
  const smartHtml = (html.match(/[\u201C\u201D\u2018\u2019]/g) || []).length;
  if (smartHtml > 5) {
    htmlIssues.push({ severity: 'P1', slug: `${coll}/${slug}`, kind: 'smart-quotes-html', detail: `${smartHtml} curly quotes in HTML` });
  }
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of imgs.slice(0, 5)) {
    if (src.includes('placeholder') || src.endsWith('/hero.jpg') && !src.includes('cloudinary.com/v')) {
      // versionless cloudinary path may 404
    }
  }
  const brokenImg = imgs.filter((s) => s.includes('more-group/mexico/') && !s.includes('/v17') && !s.includes('/v18'));
  if (brokenImg.length) {
    htmlIssues.push({ severity: 'P1', slug: `${coll}/${slug}`, kind: 'cloudinary-no-version', detail: `${brokenImg.length} images without version id` });
  }
}

let idx = 0;
async function worker() {
  while (idx < tasks.length) {
    const t = tasks[idx++];
    await auditHtml(t);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const htmlP0 = htmlIssues.filter((i) => i.severity === 'P0');
const htmlP1 = htmlIssues.filter((i) => i.severity === 'P1');
console.log(`HTML checked: ${tasks.length}`);
console.log(`HTML P0: ${htmlP0.length} | HTML P1: ${htmlP1.length}`);
for (const i of [...htmlP0, ...htmlP1]) {
  console.log(`  [${i.severity}] ${i.slug}: ${i.kind} — ${i.detail}`);
}

const totalP0 = mdxP0.length + htmlP0.length;
console.log(`\n=== SUMMARY ===`);
console.log(totalP0 ? `❌ ${totalP0} P0 issues — fix before indexing` : '✅ No P0 issues in Phase B+C audit');
process.exit(totalP0 ? 1 : 0);
