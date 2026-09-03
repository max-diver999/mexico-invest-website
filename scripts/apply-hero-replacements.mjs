#!/usr/bin/env node
/**
 * Apply a hero photography plan to the corpus.
 *
 * Two operations, both driven by a plan file so the decisions are reviewable
 * before anything is written:
 *
 *   swap    the page already owns a better frame further down the article, so
 *           the hero simply points at it. No upload, no new licence.
 *   replace nothing on the page is usable. A freely licensed photograph is
 *           pulled from Wikimedia Commons, uploaded to Cloudinary under the
 *           page's own path, and credited.
 *
 * Every replace writes three things: heroImage, heroAlt, and a row in
 * scripts/data/image-credits.json. The attribution table on /image-credits/
 * renders from that file, so a photograph cannot enter the corpus without its
 * licence and author arriving with it.
 *
 *   node scripts/apply-hero-replacements.mjs <plan.json> [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const UA = 'MexicoInvestPhotoWave/1.0 (https://mexico-invest.com)';
const ROOT = process.cwd();
const CREDITS = path.join(ROOT, 'scripts/data/image-credits.json');
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

const planPath = process.argv[2];
const DRY = process.argv.includes('--dry');
if (!planPath) {
  console.error('usage: node scripts/apply-hero-replacements.mjs <plan.json> [--dry]');
  process.exit(1);
}

/* Commons hands back thumb.wikimedia.org, which does not resolve from every
 * network; upload.wikimedia.org serves the identical bytes and does. */
const commonsUrl = (u) => String(u).replace('://thumb.wikimedia.org/', '://upload.wikimedia.org/');

async function fetchBytes(url) {
  const r = await fetch(commonsUrl(url), { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function upload(buf, publicId) {
  const ts = Math.floor(Date.now() / 1000);
  const params = { overwrite: 'true', public_id: publicId, timestamp: String(ts) };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('api_key', KEY);
  form.append('signature', crypto.createHash('sha1').update(toSign + SECRET).digest('hex'));
  form.append('file', new Blob([buf]), 'hero.jpg');
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: form });
  const j = await r.json();
  if (j.error) throw new Error('cloudinary: ' + j.error.message);
  return j.secure_url;
}

function readEntry(col, slug) {
  const file = path.join(ROOT, 'src/content', col, `${slug}.mdx`);
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('no frontmatter: ' + file);
  return { file, text, fm: m[1], block: m[0] };
}

/** Replace a scalar key in frontmatter, or insert it after heroImage. */
function setKey(fm, key, value) {
  const line = `${key}: ${JSON.stringify(value)}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(fm)) return fm.replace(re, line);
  if (/^heroImage:.*$/m.test(fm)) return fm.replace(/^(heroImage:.*)$/m, `$1\n${line}`);
  return `${fm}\n${line}`;
}

/** Inline Cloudinary URLs in body order, so "in1" means the same thing here
 *  as it did to the reviewer who picked it. */
function inlineUrls(text, hero) {
  const body = text.replace(/^---\n[\s\S]*?\n---/, '');
  const seen = [];
  for (const u of body.match(/https:\/\/res\.cloudinary\.com\/[^\s")']+/g) || []) {
    const clean = u.replace(/[),.]+$/, '');
    if (clean !== hero && !seen.includes(clean)) seen.push(clean);
  }
  return seen;
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const credits = JSON.parse(fs.readFileSync(CREDITS, 'utf8'));
const done = { swap: 0, replace: 0, failed: [] };

for (const item of plan) {
  const { op, col, slug } = item;
  let entry;
  try { entry = readEntry(col, slug); } catch (e) { done.failed.push([col + '/' + slug, e.message]); continue; }
  const heroM = entry.fm.match(/^heroImage:\s*(.*)$/m);
  const hero = heroM ? heroM[1].trim().replace(/^["']/, '').replace(/["']$/, '') : '';

  try {
    if (op === 'swap') {
      const urls = inlineUrls(entry.text, hero);
      const idx = Number(String(item.toTag).replace(/\D/g, '')) - 1;
      const target = urls[idx];
      if (!target) throw new Error(`no ${item.toTag} on the page (${urls.length} inline frames)`);
      let fm = setKey(entry.fm, 'heroImage', target);
      if (item.alt) fm = setKey(fm, 'heroAlt', item.alt);
      if (!DRY) fs.writeFileSync(entry.file, entry.text.replace(entry.block, `---\n${fm}\n---`));
      done.swap++;
      console.log(`swap    ${col}/${slug} -> ${item.toTag}`);
    } else if (op === 'replace') {
      const publicId = `more-group/mexico/${col}/${slug}/hero`;
      let url = `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}.jpg`;
      if (!DRY) url = await upload(await fetchBytes(item.thumbUrl), publicId);
      let fm = setKey(entry.fm, 'heroImage', url);
      if (item.alt) fm = setKey(fm, 'heroAlt', item.alt);
      if (item.heroCredit) fm = setKey(fm, 'heroCredit', item.heroCredit);
      fm = fm.replace(/^heroShared:\s*true\s*$/m, 'heroShared: false');
      if (!DRY) fs.writeFileSync(entry.file, entry.text.replace(entry.block, `---\n${fm}\n---`));
      const row = {
        page: `/${col}/${slug}/`,
        pageLabel: `${col}/${slug}`,
        sourceUrl: item.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURI(item.commonsTitle)}`,
        fileTitle: String(item.commonsTitle).replace(/^File:/, ''),
        licence: item.licence,
        licenceUrl: item.licenceUrl || '',
        author: item.author || 'Unknown',
      };
      /* One row per page, not per file: a page that gets a second replacement
       * later must not leave the first photograph credited as if still in use. */
      const at = credits.findIndex((c) => c.page === row.page);
      if (at >= 0) credits[at] = row; else credits.push(row);
      done.replace++;
      console.log(`replace ${col}/${slug} <- ${item.commonsTitle} (${item.licence})`);
    } else {
      throw new Error('unknown op: ' + op);
    }
  } catch (e) {
    done.failed.push([col + '/' + slug, e.message]);
    console.log(`FAILED  ${col}/${slug}: ${e.message}`);
  }
}

if (!DRY) fs.writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + '\n');
console.log(`\nswap ${done.swap} | replace ${done.replace} | failed ${done.failed.length}`);
done.failed.forEach((f) => console.log('  ! ' + f.join(': ')));
