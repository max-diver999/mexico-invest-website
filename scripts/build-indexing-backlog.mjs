#!/usr/bin/env node
/**
 * Indexing backlog for mexico-invest.com.
 * Truth: submitted-urls.json entries[] + git touch per MDX + live sitemap.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HOST = 'https://mexico-invest.com';

const COL = {
  guides: 'guides',
  compare: 'compare',
  areas: 'areas',
  news: 'news',
  projects: 'projects',
  developers: 'developers',
};

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : join(__dirname, 'indexing-backlog.json');

function norm(u) {
  return u.replace(/\/$/, '').trim();
}

function fetch(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res(d));
    }).on('error', rej);
  });
}

function lastGitTouch(rel) {
  try {
    return execSync(`git -C "${ROOT}" log -1 --format=%cI -- "${rel}"`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const slugToMdx = new Map();
for (const [dir, segment] of Object.entries(COL)) {
  const folder = join(ROOT, 'src/content', dir);
  if (!existsSync(folder)) continue;
  for (const file of readdirSync(folder)) {
    if (!file.endsWith('.mdx')) continue;
    const slug = file.replace(/\.mdx$/, '');
    slugToMdx.set(`${segment}/${slug}`, `src/content/${dir}/${file}`);
  }
}

function mdxRelForUrl(url) {
  const path = norm(url).replace(HOST, '').replace(/^\//, '');
  return slugToMdx.get(path) || null;
}

function isNoindex(rel) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return /^noindex:\s*true\s*$/m.test(fm);
}

const ledger = JSON.parse(readFileSync(join(__dirname, 'submitted-urls.json'), 'utf8'));
const inLedger = new Set((ledger.urls || []).map(norm));
const lastApi = {};
for (const e of ledger.entries || []) {
  const u = norm(e.url);
  if (!lastApi[u] || e.at > lastApi[u]) lastApi[u] = e.at;
}

const sitemapIndex = await fetch(`${HOST}/sitemap-index.xml`);
const maps = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemap = new Set();
for (const sm of maps) {
  const xml = await fetch(sm);
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (m[1].startsWith(HOST)) sitemap.add(norm(m[1]));
  }
}

const items = [];
for (const n of sitemap) {
  const rel = mdxRelForUrl(n);
  if (rel && isNoindex(rel)) continue;

  const gitAt = rel ? lastGitTouch(rel) : '';
  const apiAt = lastApi[n] || null;
  const inLed = inLedger.has(n);

  let reason = null;
  let priority = 0;
  if (!apiAt) {
    reason = inLed ? 'ledger_only_never_api' : 'never_submitted';
    priority = inLed ? 90_000 : 100_000;
  } else if (gitAt && gitAt > apiAt) {
    reason = 'content_changed_after_api';
    priority = 70_000;
  } else {
    continue;
  }

  const seg = n.replace(HOST, '').split('/').filter(Boolean)[0] || 'root';
  if (seg === 'guides') priority += 800;
  else if (seg === 'compare') priority += 1000;
  else if (seg === 'areas') priority += 900;
  else if (seg === 'projects') priority += 500;
  else if (seg === 'developers') priority += 600;
  else if (seg === 'news') priority += 1200;

  items.push({ url: `${n}/`, norm: n, reason, priority, gitAt, apiAt, collection: seg });
}

items.sort((a, b) => b.priority - a.priority);

const byReason = {};
const byCollection = {};
for (const it of items) {
  byReason[it.reason] = (byReason[it.reason] || 0) + 1;
  byCollection[it.collection] = (byCollection[it.collection] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  site: HOST,
  projectId: 'mexico-invest-indexing',
  sitemapTotal: sitemap.size,
  ledgerTotal: inLedger.size,
  apiLoggedUnique: Object.keys(lastApi).length,
  backlogTotal: items.length,
  byReason,
  byCollection,
  urls: items.map((x) => x.url),
  items,
};

writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
console.log(`Backlog: ${items.length} URLs → ${outPath}`);
console.log('By reason:', byReason);
console.log('By collection:', byCollection);
