#!/usr/bin/env node
/**
 * Rewrite generated image alt text.
 *
 * The generator built alts by concatenating the source filename with the page title
 * and a fixed suffix, producing lines like:
 *
 *   "Suite Ocean Vibes.Jpg Inlbc5, Airbnb Investment Mexico Guide buyer context"
 *   "Xela-26_11zon: US capital gains Mexico sale context"
 *
 * 183 of 624 inline alts ended in "market context" or "buyer context", and many
 * carried a raw filename with its extension and a CDN hash.
 *
 * An alt describes the image, so the useful part of that string is the leading
 * subject — it came from the source filename and is the only real information
 * available about what the photograph shows. The injected page title and the fixed
 * "market context" / "buyer context" suffix are noise and go.
 *
 *   "Mérida - Gastronomia, American Retiree Mexico Real Estate market context"
 *     -> "Mérida gastronomia"
 *   "Suite Ocean Vibes.Jpg Inlbc5, Airbnb Investment Mexico Guide buyer context"
 *     -> "Suite Ocean Vibes"
 *
 * Where the entry names an area, it is appended so the alt places the image.
 * Nothing is invented about what is depicted: this script cannot see the image, and
 * a confident wrong description is worse than a plain one. Alts that already read as
 * real descriptions are left untouched, and anything reduced to nothing is reported
 * for the hand pass rather than replaced with a guess.
 *
 * Usage: node scripts/fix-image-alts.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');

/** Proper nouns the corpus uses, so recovered alts keep their capitals. */
const ENTITIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/lib/corpus-entities.json'), 'utf8'));
const ENTITY_BY_LOWER = new Map(ENTITIES.map((e) => [e.toLowerCase(), e]));

/** Alt text shapes the generator produced. Anything else is left alone. */
const GENERATED =
  /(?:\s(?:market|buyer|investment)\s+context|context)\s*$|\.(?:jpe?g|png|webp|avif)\b|_11zon|\bInl[a-z0-9]{3,}\b|\bScaled\b/i;

/** Market wording for the alt, from the entry's own frontmatter. */
const AREA_LABEL = {
  'aldea-zama-tulum': 'Aldea Zama, Tulum',
  'cabo-corridor': 'the Cabo corridor',
  'cabo-san-lucas': 'Cabo San Lucas',
  'east-cape-baja': 'the East Cape, Baja California Sur',
  'gonzalo-guerrero-playa': 'Gonzalo Guerrero, Playa del Carmen',
  'north-shore-xcalacoco': 'Xcalacoco, Playa del Carmen',
  'nuevo-vallarta': 'Nuevo Vallarta',
  'playa-del-carmen': 'Playa del Carmen',
  'puerto-morelos': 'Puerto Morelos',
  'puerto-vallarta': 'Puerto Vallarta',
  'punta-de-mita': 'Punta de Mita',
  'punta-mita': 'Punta Mita',
  'riviera-nayarit': 'Riviera Nayarit',
  'san-jose-del-cabo': 'San José del Cabo',
  akumal: 'Akumal',
  bacalar: 'Bacalar',
  campeche: 'Campeche',
  cancun: 'Cancún',
  cozumel: 'Cozumel',
  holbox: 'Holbox',
  tulum: 'Tulum',
};

function subjectOf(title) {
  return String(title)
    .split(':')[0]
    .replace(/\s+(?:Review|Guide|Investment Guide|Real Estate|Developer Profile)\b.*$/i, '')
    .replace(/\s+20\d\d$/, '')
    .trim();
}

/**
 * Strip the generator's additions and recover the subject the filename carried.
 * Returns null when nothing survives, which means there is no honest alt to write.
 */
function subjectFromAlt(alt, pageSubject) {
  let text = alt
    // "Subject: page title context" and "Subject, page title buyer context"
    .replace(/\s*[:,]\s*[^,:]*\bcontext\s*$/i, '')
    .replace(/,?\s*[^,:]*\b(?:market|buyer|investment)\s+context\s*$/i, '')
    .replace(/\s+context\s*$/i, '')
    // filename residue
    .replace(/\.(?:jpe?g|png|webp|avif)\b/gi, ' ')
    .replace(/_11zon\b/gi, ' ')
    .replace(/\bInl[a-z0-9]{3,}\b/g, ' ')
    .replace(/\bScaled\b/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s*\d{2,}\s*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,:;-]+|[\s,:;-]+$/g, '')
    .trim();

  // The page title often survives at the tail; drop it rather than repeat it.
  if (pageSubject) {
    const tail = new RegExp(`[,:]?\\s*${pageSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
    text = text.replace(tail, '').trim();
  }
  // Trailing CDN sequence numbers carry nothing.
  text = text.replace(/\s+\d{1,3}$/, '').trim();
  if (text.split(/\s+/).filter(Boolean).length < 2) return null;
  // Restore capitals on the place and brand names the lowercasing flattened.
  text = text
    .split(/(\s+)/)
    .map((tok) => ENTITY_BY_LOWER.get(tok.toLowerCase()) ?? tok)
    .join('');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

let files = 0;
let rewritten = 0;
let untouched = 0;
const samples = [];
const unresolved = [];

for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const m = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) continue;
    const [, frontmatter, body] = m;

    const title = (frontmatter.match(/^title:\s*["']?(.*?)["']?\s*$/m) ?? [, ''])[1];
    const area = (frontmatter.match(/^area:\s*["']?(.*?)["']?\s*$/m) ?? [, ''])[1];
    const subject = subjectOf(title);
    const where = AREA_LABEL[area] ?? null;

    const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
    if (!images.length) continue;

    let changedHere = false;
    const next = body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (whole, alt, src) => {
      if (!GENERATED.test(alt)) {
        untouched++;
        return whole;
      }
      const recovered = subjectFromAlt(alt, subject);
      if (!recovered) {
        unresolved.push(`${collection}/${file.replace(/\.mdx?$/, '')}: "${alt}"`);
        return whole;
      }
      const newAlt = where ? `${recovered}, ${where}` : recovered;
      rewritten++;
      changedHere = true;
      if (samples.length < 12) samples.push(`  ${alt}\n    -> ${newAlt}`);
      return `![${newAlt}](${src})`;
    });

    if (!changedHere) continue;
    files++;
    if (!DRY) fs.writeFileSync(abs, frontmatter + next);
  }
}

console.log(`\n=== IMAGE ALT TEXT ${DRY ? '(dry run)' : ''} ===`);
console.log(`Files changed: ${files}`);
console.log(`Alts rewritten: ${rewritten} | already descriptive, left alone: ${untouched}\n`);
for (const s of samples) console.log(s);
if (unresolved.length) {
  console.log(`\nNo usable subject survived — needs a human alt or the image removing: ${unresolved.length}`);
  for (const u of unresolved.slice(0, 20)) console.log('  ' + u);
  if (unresolved.length > 20) console.log(`  ... and ${unresolved.length - 20} more`);
}
console.log('');
