import fs from 'node:fs';
import path from 'node:path';

/**
 * Route paths for every content page carrying `noindex: true`.
 *
 * Wave 6 closed 45 pages by marking them noindex, but the sitemap filter only
 * knew a hardcoded exclusion list, so 44 of them stayed in sitemap-0.xml. A
 * noindexed URL submitted in a sitemap is reported by Google as a coverage
 * error and spends crawl budget on a page we deliberately closed.
 *
 * Read at config time, so a page closed in frontmatter leaves the sitemap on
 * the next build with nothing else to remember.
 */
export function collectNoindexPaths(root = process.cwd()) {
  const contentRoot = path.join(root, 'src', 'content');
  if (!fs.existsSync(contentRoot)) return [];

  const paths = [];
  for (const collection of fs.readdirSync(contentRoot)) {
    const dir = path.join(contentRoot, collection);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.mdx')) continue;
      // Frontmatter only: the body of a page may legitimately discuss noindex.
      const frontmatter = fs.readFileSync(path.join(dir, file), 'utf8').split('---')[1] ?? '';
      if (!/^noindex:\s*true\s*$/m.test(frontmatter)) continue;
      paths.push(`/${collection}/${file.replace(/\.mdx$/, '')}/`);
    }
  }
  return paths;
}
