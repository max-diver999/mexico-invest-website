// IndexNow — submit mexico-invest.com URLs to Bing ONLY (never api.indexnow.org / Yandex)
// Run: node scripts/indexnow-submit.mjs
//   or: node scripts/indexnow-submit.mjs --explicit URL URL ...

import { readdirSync } from 'fs';

const KEY = 'mexicoinvest2026indexnowkey01';
const HOST = 'mexico-invest.com';
const BASE = `https://${HOST}`;

const args = process.argv.slice(2);
const explicitIdx = args.indexOf('--explicit');
const explicitUrls =
  explicitIdx !== -1 ? args.slice(explicitIdx + 1).filter((a) => /^https?:\/\//.test(a)) : [];

function buildAllUrls() {
  const urls = [
    `${BASE}/`,
    `${BASE}/guides/`,
    `${BASE}/areas/`,
    `${BASE}/compare/`,
    `${BASE}/about/`,
    `${BASE}/methodology/`,
    `${BASE}/contact/`,
    `${BASE}/get-shortlist/`,
    `${BASE}/privacy-policy/`,
    `${BASE}/terms/`,
  ];

  for (const [section, subPath] of [
    ['guides', './src/content/guides'],
    ['areas', './src/content/areas'],
    ['compare', './src/content/compare'],
  ]) {
    try {
      for (const file of readdirSync(subPath)) {
        if (file.endsWith('.mdx')) {
          const slug = file.replace('.mdx', '');
          urls.push(`${BASE}/${section}/${slug}/`);
        }
      }
    } catch {
      // collection missing — skip
    }
  }

  return urls;
}

const urls = explicitUrls.length > 0 ? explicitUrls : buildAllUrls();

if (explicitUrls.length > 0) {
  console.log(`IndexNow explicit mode: ${urls.length} URL(s)`);
} else {
  console.log(`Submitting ${urls.length} URLs to Bing IndexNow...`);
}

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `${BASE}/${KEY}.txt`,
  urlList: urls,
});

const res = await fetch('https://www.bing.com/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body,
});

console.log(`Response: ${res.status} ${res.statusText}`);

if (res.status === 200) {
  console.log(`✅ Success! ${urls.length} URLs submitted to Bing IndexNow`);
} else if (res.status === 202) {
  console.log('✅ Accepted! URLs queued for processing.');
} else {
  const text = await res.text();
  console.log(`Response body: ${text}`);
}

console.log('\nSubmitted URLs:');
urls.forEach((u) => console.log(' ', u));
