#!/usr/bin/env node
/**
 * Whole-site rendered audit.
 *
 * Complements scripts/audit-rendered-live.mjs, which only scans the pages
 * derived from src/content and only checks for regressions of past incidents.
 * This one walks every built HTML file — hubs and static pages included — and
 * checks the classes of defect the Phase 0 audit found and the old gate missed.
 *
 * Usage: node scripts/audit-site-html.mjs [--fail]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist/client');
const failOnIssues = process.argv.includes('--fail');

if (!fs.existsSync(DIST)) {
  console.error('dist/client not found — run `npm run build` first.');
  process.exit(1);
}

/** Files that are intentionally not real pages. */
const IGNORE = /^\/google[0-9a-f]+\.html$/;

/** Titles and descriptions are entity-encoded in HTML; measure the real text. */
function decode(str) {
  if (str == null) return null;
  return str
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(DIST);

const pages = files.map((f) => {
  const html = fs.readFileSync(f, 'utf8');
  const url = '/' + path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const one = (re) => decode(html.match(re)?.[1] ?? null);
  const all = (re) => [...html.matchAll(re)].map((m) => m[1]);
  return {
    url,
    html,
    title: one(/<title>([\s\S]*?)<\/title>/),
    desc: one(/<meta[^>]+name="description"[^>]+content="([^"]*)"/),
    canonical: one(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/),
    robots: one(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/),
    ogImage: one(/<meta[^>]+property="og:image"[^>]+content="([^"]*)"/),
    h1: all(/<h1[^>]*>([\s\S]*?)<\/h1>/g).map((s) => s.replace(/<[^>]*>/g, '').trim()),
    h2: all(/<h2[^>]*>([\s\S]*?)<\/h2>/g).map((s) => s.replace(/<[^>]*>/g, '').trim()),
    imgs: [...html.matchAll(/<img\b([^>]*)>/g)].map((m) => m[1]),
    hrefs: [...new Set([...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]))],
    ld: [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
  };
}).filter((p) => !IGNORE.test(p.url));

const routes = new Set(pages.map((p) => p.url));
/** Non-page assets that are legitimate link targets. */
const ASSETS = new Set(['/llms.txt', '/llms-full.txt', '/robots.txt', '/sitemap-index.xml', '/site.webmanifest', '/og-default.png', '/favicon.svg', '/design-preview.html']);

const indexable = (p) => !/noindex/.test(p.robots || '');

const issues = [];
const add = (severity, id, url, detail) => issues.push({ severity, id, url, detail });

/* ---- per-page checks ---- */
for (const p of pages) {
  if (!indexable(p)) continue;

  if (p.h1.length !== 1) add('P0', 'h1-count', p.url, `${p.h1.length} <h1> elements (expected 1)`);

  if (p.title) {
    // The title generator appended its own suffix on top of a title that already
    // carried one: "… Cost Guide 2026 2026 Guide 2026". Catch the repeated word
    // and the repeated year, not only the pipe-separated form.
    const dup =
      p.title.match(/(\b20\d\d\b[^|]*)\|\s*\1/i) ||
      /\|\s*20\d\d Guide/i.test(p.title) ||
      /\bGuide\b[^|]*\bGuide\b/i.test(p.title) ||
      /\b(20\d\d)\b[^|]*\b\1\b/.test(p.title);
    if (dup) add('P0', 'title-duplicate-suffix', p.url, `duplicated suffix: "${p.title}"`);
    if (p.title.length > 60) add('P1', 'title-too-long', p.url, `${p.title.length} rendered chars: "${p.title}"`);
  } else {
    add('P0', 'title-missing', p.url, 'no <title>');
  }

  if (!p.desc) add('P0', 'description-missing', p.url, 'no meta description');
  else if (p.desc.length > 160) add('P1', 'description-too-long', p.url, `${p.desc.length} chars`);
  else if (p.desc.length < 80) add('P1', 'description-too-short', p.url, `${p.desc.length} chars`);

  if (!p.canonical) add('P0', 'canonical-missing', p.url, 'indexable page without canonical');

  if (p.ogImage && /\.svg(\?|$)/i.test(p.ogImage)) {
    add('P1', 'og-image-svg', p.url, 'og:image is an SVG — not supported by most platforms');
  }

  for (const attrs of p.imgs) {
    if (!/\balt\s*=/.test(attrs)) add('P1', 'img-alt-missing', p.url, 'img without alt attribute');
    // An empty alt is correct for a decorative image; the markup has to say so.
    else if (/\balt\s*=\s*(["'])\s*\1/.test(attrs) && !/\bdata-decorative\b/.test(attrs)) {
      add('P1', 'img-alt-empty', p.url, 'img with empty alt and no data-decorative');
    }
  }

  const seen = new Set();
  for (const h of p.h2) {
    if (seen.has(h)) add('P1', 'duplicate-h2', p.url, `repeated <h2>: "${h}"`);
    seen.add(h);
  }

  for (const s of p.ld) {
    try { JSON.parse(s); } catch (e) { add('P0', 'jsonld-invalid', p.url, e.message.slice(0, 80)); }
  }

  /* raw markdown leaking into rendered text (component string props bypass MDX) */
  const visible = p.html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ');
  const mdLink = visible.match(/\[[^\]\n]{2,80}\]\(\/[a-z0-9-\/]+\)/);
  if (mdLink) add('P1', 'raw-markdown-visible', p.url, `"${mdLink[0].slice(0, 70)}"`);

  for (const href of p.hrefs) {
    if (ASSETS.has(href) || href.startsWith('/_astro/') || href.startsWith('/api/')) continue;
    const target = href.endsWith('/') ? href : `${href}/`;
    if (!routes.has(target) && !routes.has(href)) {
      add('P0', 'broken-internal-link', p.url, `-> ${href}`);
    }
  }
}

/* ---- site-wide checks ---- */
const byTitle = new Map();
for (const p of pages) {
  if (!indexable(p) || !p.title) continue;
  if (!byTitle.has(p.title)) byTitle.set(p.title, []);
  byTitle.get(p.title).push(p.url);
}
for (const [title, urls] of byTitle) {
  if (urls.length > 1) add('P1', 'duplicate-title', urls.join(', '), `"${title}"`);
}

const inbound = new Map(pages.map((p) => [p.url, 0]));
for (const p of pages) {
  for (const href of p.hrefs) {
    const target = href.endsWith('/') ? href : `${href}/`;
    if (target !== p.url && inbound.has(target)) inbound.set(target, inbound.get(target) + 1);
  }
}
for (const p of pages) {
  if (!indexable(p)) continue;
  if (p.url === '/') continue;
  if (inbound.get(p.url) === 0) add('P1', 'orphan-page', p.url, 'no inbound internal links');
}

/* ---- report ---- */
const byId = new Map();
for (const i of issues) {
  if (!byId.has(i.id)) byId.set(i.id, []);
  byId.get(i.id).push(i);
}

console.log(`\n=== SITE HTML AUDIT (mexico-invest) ===`);
console.log(`Pages scanned: ${pages.length} | indexable: ${pages.filter(indexable).length}\n`);

if (!issues.length) {
  console.log('✅ PASS — no issues found.\n');
} else {
  for (const [id, list] of [...byId].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`[${list[0].severity}] ${id} — ${list.length}`);
    for (const i of list.slice(0, 8)) console.log(`      ${i.url}  ${i.detail}`);
    if (list.length > 8) console.log(`      ... and ${list.length - 8} more`);
  }
  const p0 = issues.filter((i) => i.severity === 'P0').length;
  const p1 = issues.filter((i) => i.severity === 'P1').length;
  console.log(`\nP0 (must fix): ${p0}\nP1 (cleanup):  ${p1}\n`);
  if (failOnIssues && p0 > 0) process.exit(1);
}
