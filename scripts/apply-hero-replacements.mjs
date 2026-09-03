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

/**
 * Ask Commons for a thumbnail at a width we choose, rather than reusing the
 * URL a search happened to return. Two reasons: the hero transform renders at
 * 1600px and c_fill will upscale anything smaller, and a URL captured during
 * review can be stale by the time the plan is applied.
 */
async function commonsThumb(fileTitle, width = 1800) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action', 'query');
  u.searchParams.set('titles', fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`);
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size');
  u.searchParams.set('iiurlwidth', String(width));
  u.searchParams.set('format', 'json');
  const r = await fetch(u, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
  if (!r.ok) throw new Error('commons api ' + r.status);
  const j = await r.json();
  const page = Object.values(j?.query?.pages || {})[0];
  const ii = (page?.imageinfo || [])[0];
  if (!ii?.thumburl) throw new Error('no thumbnail for ' + fileTitle);
  return ii.thumburl;
}

/**
 * Who to credit. Commons' Artist field is written by uploaders and is often
 * "Own work" or a bare profile URL, neither of which is a name a reader can
 * use. Fall back through Attribution and Credit to the uploader, and reduce a
 * URL to the account name it ends in.
 */
async function resolveAuthor(fileTitle, fallback) {
  const strip = (v) => String(v || '').replace(/<[^>]*>/g, '').trim();
  const fromUrl = (v) => {
    const m = /^https?:\/\/[^\s]+?\/([^\/\s?#]+)\/?$/.exec(v);
    return m ? `${m[1]} (via ${new URL(v).hostname.replace(/^www\./, '')})` : v;
  };
  try {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.searchParams.set('action', 'query');
    u.searchParams.set('titles', fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`);
    u.searchParams.set('prop', 'imageinfo');
    u.searchParams.set('iiprop', 'extmetadata|user');
    u.searchParams.set('format', 'json');
    const j = await (await fetch(u, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } })).json();
    const ii = (Object.values(j?.query?.pages || {})[0]?.imageinfo || [])[0] || {};
    const md = ii.extmetadata || {};
    const artist = strip(md.Artist?.value);
    if (artist && !/^own work$/i.test(artist) && !/^https?:\/\//.test(artist)) return artist;
    const attribution = strip(md.Attribution?.value).replace(/^©\s*/, '').replace(/\s*\/\s*Wikimedia Commons$/i, '');
    if (attribution) return attribution;
    if (/^https?:\/\//.test(artist)) return fromUrl(artist);
    const credit = strip(md.Credit?.value);
    if (credit && !/^https?:\/\//.test(credit)) return credit;
    if (ii.user) return ii.user;
  } catch { /* fall through to whatever the reviewer recorded */ }
  return fallback || 'Unknown';
}

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
      /*
       * Promoting a frame out of the article leaves it on the page twice: once
       * at the top as the hero and once again where it always sat. Take it out
       * of the body. The frame it replaces is not demoted into that slot: it was
       * rejected on the way out, and a rejected picture does not become
       * acceptable by moving down the page.
       */
      let body = entry.text.slice(entry.block.length);
      const before = body;
      const esc = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      /* Take the blank line above the image with it, so the paragraphs on
       * either side close up exactly as they were rather than leaving a gap
       * that a later formatting pass would have to notice. */
      body = body.replace(new RegExp(`\\n\\n!\\[[^\\]]*\\]\\(${esc}\\)[^\\n]*\\n`, 'g'), '\n');
      if (before === body) {
        body = body.replace(new RegExp(`!\\[[^\\]]*\\]\\(${esc}\\)[^\\n]*\\n?`, 'g'), '');
      }
      const removed = before !== body;
      if (!removed) console.log(`  note  ${col}/${slug}: promoted frame was not found as markdown in the body`);
      if (!DRY) fs.writeFileSync(entry.file, `---\n${fm}\n---` + body);
      done.swap++;
      console.log(`swap    ${col}/${slug} -> ${item.toTag}${removed ? ' (body copy removed)' : ''}`);
    } else if (op === 'replace') {
      const publicId = `more-group/mexico/${col}/${slug}/hero`;
      let url = `https://res.cloudinary.com/${CLOUD}/image/upload/${publicId}.jpg`;
      if (!DRY) {
        const source = await commonsThumb(item.commonsTitle).catch(() => item.thumbUrl);
        url = await upload(await fetchBytes(source), publicId);
      }
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
        author: await resolveAuthor(item.commonsTitle, item.author),
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
