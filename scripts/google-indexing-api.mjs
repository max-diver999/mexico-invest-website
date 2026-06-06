// Google Indexing API — mexico-invest.com
// Usage:
//   node scripts/google-indexing-api.mjs [--batch N] [--offset N]
//   node scripts/google-indexing-api.mjs --explicit URL URL ...
//
// Daily quota: 200 URL/day. Use --offset for multi-day batches.
// NEVER run without explicit «отправляй» from Maksim.

import { GoogleAuth } from 'google-auth-library';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(__dirname, 'google-indexing-key.json');
const HOST = 'https://mexico-invest.com';
const ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

const args = process.argv.slice(2);
const explicitIdx = args.indexOf('--explicit');
const explicitUrls =
  explicitIdx !== -1 ? args.slice(explicitIdx + 1).filter((a) => /^https?:\/\//.test(a)) : [];
const batchSize = parseInt(args[args.indexOf('--batch') + 1]) || 200;
const offset = parseInt(args[args.indexOf('--offset') + 1]) || 0;

function collectUrls() {
  const urls = [
    `${HOST}/`,
    `${HOST}/guides/`,
    `${HOST}/areas/`,
    `${HOST}/compare/`,
    `${HOST}/about/`,
    `${HOST}/methodology/`,
    `${HOST}/contact/`,
    `${HOST}/get-shortlist/`,
    `${HOST}/privacy-policy/`,
    `${HOST}/terms/`,
  ];

  const contentDirs = {
    guides: join(__dirname, '..', 'src', 'content', 'guides'),
    areas: join(__dirname, '..', 'src', 'content', 'areas'),
    compare: join(__dirname, '..', 'src', 'content', 'compare'),
  };

  for (const [section, dir] of Object.entries(contentDirs)) {
    try {
      for (const file of readdirSync(dir)) {
        if (file.endsWith('.mdx')) {
          const slug = file.replace('.mdx', '');
          urls.push(`${HOST}/${section}/${slug}/`);
        }
      }
    } catch (e) {
      console.warn(`  Skipping ${section}: ${e.message}`);
    }
  }

  return urls;
}

async function main() {
  let allUrls;
  if (explicitUrls.length > 0) {
    allUrls = explicitUrls;
    console.log(`Explicit mode: ${allUrls.length} URL(s) (batch/offset ignored)`);
  } else {
    allUrls = collectUrls();
    console.log(`Total URLs found: ${allUrls.length}`);
  }

  const batch = explicitUrls.length > 0 ? allUrls : allUrls.slice(offset, offset + batchSize);
  console.log(
    explicitUrls.length > 0
      ? `Submitting all explicit URLs: ${batch.length}`
      : `Submitting batch: offset=${offset}, size=${batch.length} (of ${allUrls.length} total)`,
  );

  if (batch.length === 0) {
    console.log('No URLs to submit. All done!');
    return;
  }

  const auth = new GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();

  let success = 0;
  let errors = 0;

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    try {
      const res = await client.request({
        url: ENDPOINT,
        method: 'POST',
        data: { url, type: 'URL_UPDATED' },
      });

      if (res.status === 200) {
        success++;
        if (success % 20 === 0 || i === batch.length - 1) {
          console.log(`  [${i + 1}/${batch.length}] ${success} OK, ${errors} errors`);
        }
      } else {
        errors++;
        console.log(`  [${i + 1}] ${url} — ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      errors++;
      const msg = e.response?.data?.error?.message || e.message;
      console.log(`  [${i + 1}] FAIL ${url} — ${msg}`);

      if (e.response?.status === 429) {
        console.log('\n⚠ Daily quota exceeded. Run again tomorrow with:');
        console.log(`  node scripts/google-indexing-api.mjs --offset ${offset + i}`);
        break;
      }
    }

    if (i % 50 === 49) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! Success: ${success}, Errors: ${errors}`);
  if (explicitUrls.length > 0) return;
  if (offset + batchSize < allUrls.length) {
    console.log(`\nRemaining URLs: ${allUrls.length - offset - batchSize}`);
    console.log(`Run tomorrow: node scripts/google-indexing-api.mjs --offset ${offset + batchSize}`);
  } else {
    console.log('\nAll URLs have been submitted!');
  }
}

main().catch(console.error);
