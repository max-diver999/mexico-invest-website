#!/usr/bin/env node
/**
 * Remove hand-written "Related guides" list sections from article bodies.
 *
 * ArticleLayout now renders two related-link blocks below every article: the curated
 * relatedSlugs and the entity links the geo taxonomy resolves. A hand-written list of
 * the same links inside the body is a second copy of that navigation, and it is the
 * only kind of H2 on the site whose section opens with no prose at all.
 *
 * Any link the body list carries that is NOT already in relatedSlugs is promoted into
 * relatedSlugs before the section goes, so no curated connection is lost.
 *
 * Usage: node scripts/fix-related-sections.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];
const DRY = process.argv.includes('--dry');

/**
 * Headings whose section is a list of links to elsewhere on this site.
 *
 * H3 as well as H2: a first pass matched only H2 and left 24 files carrying the same
 * duplicated navigation one level down.
 */
const RELATED_HEADING =
  /^#{2,3} (?:Related|Next reads?|What to read next|Further reading|Extended reading|More guides|Keep reading)\b[^\n]*$/im;

/** The relatedSlugs cap: more than this and the block stops being a curation. */
const MAX_RELATED = 8;

let filesChanged = 0;
let sectionsRemoved = 0;
let slugsPromoted = 0;
const kept = [];

for (const collection of COLLECTIONS) {
  const dir = path.join(CONTENT, collection);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const abs = path.join(dir, file);
    const raw = fs.readFileSync(abs, 'utf8');
    const m = raw.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) continue;
    let [, frontmatter, body] = m;
    const selfSlug = file.replace(/\.mdx?$/, '');

    let changedHere = false;
    let guard = 0;
    while (guard++ < 6) {
      const hit = body.match(RELATED_HEADING);
      if (!hit) break;
      const start = hit.index;
      const after = body.slice(start + hit[0].length);
      const nextH2 = after.search(/\n#{2,3} /);
      const nextComponent = after.search(/\n<(?:FaqBlock|CtaBox)/);
      // A horizontal rule also closes the section — otherwise the italic disclaimer
      // that follows it counts as the section's prose and the list survives.
      const nextRule = after.search(/\n-{3,}\s*\n/);
      const ends = [nextH2, nextComponent, nextRule].filter((i) => i >= 0);
      const end = ends.length ? start + hit[0].length + Math.min(...ends) : body.length;
      const section = body.slice(start, end);

      // Only remove a section that really is a link list: at least two links, and
      // no substantive prose beyond them.
      const links = [...section.matchAll(/\]\((\/[a-z0-9-]+\/[a-z0-9-]+)\/?\)/g)].map((x) => x[1]);
      const prose = section
        .replace(/^#{2,3} .*$/m, '')
        .replace(/^[-*]\s.*$/gm, '')
        .replace(/^\|.*$/gm, '')
        .replace(/\[[^\]]*\]\([^)]*\)/g, '')
        // A sentence that is only connective tissue between links is navigation,
        // not prose: "Retirees should review , , and ." must not save the section.
        .replace(/[\s·.,;:—-]/g, '');
      if (links.length < 2 || prose.length > 120) {
        kept.push(`${collection}/${selfSlug}: "${hit[0].replace(/^#+ /, '').slice(0, 60)}" — has prose, left in place`);
        break;
      }

      // Promote anything not already curated.
      const fmMatch = frontmatter.match(/^relatedSlugs:\s*\n((?:\s+-\s.*\n)*)/m);
      const current = fmMatch
        ? fmMatch[1].split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        : [];
      const additions = [];
      for (const href of links) {
        const slug = href.split('/').pop();
        if (!slug || slug === selfSlug) continue;
        if (current.includes(slug) || additions.includes(slug)) continue;
        if (current.length + additions.length >= MAX_RELATED) break;
        additions.push(slug);
      }
      if (additions.length && fmMatch) {
        const block = [...current, ...additions].map((s) => `  - "${s}"`).join('\n');
        frontmatter = frontmatter.replace(fmMatch[0], `relatedSlugs:\n${block}\n`);
        slugsPromoted += additions.length;
      }

      body = body.slice(0, start) + body.slice(end);
      sectionsRemoved++;
      changedHere = true;
    }

    if (!changedHere) continue;
    // Tidy the separators the removal can leave behind.
    body = body
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(?:\n\n---)+\n\n(?=<FaqBlock)/g, '\n\n')
      .replace(/\n\n---\s*$/g, '\n')
      .trimEnd() + '\n';

    filesChanged++;
    if (!DRY) fs.writeFileSync(abs, frontmatter + body);
  }
}

console.log(`\n=== HAND-WRITTEN RELATED SECTIONS ${DRY ? '(dry run)' : ''} ===`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Sections removed: ${sectionsRemoved}`);
console.log(`Links promoted into relatedSlugs: ${slugsPromoted}`);
if (kept.length) {
  console.log(`\nLeft in place (carry prose, not just links): ${kept.length}`);
  for (const k of kept.slice(0, 12)) console.log('  ' + k);
}
console.log('');
