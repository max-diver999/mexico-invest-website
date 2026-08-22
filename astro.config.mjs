import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

/**
 * lastmod for the sitemap, read straight from the MDX frontmatter.
 * @astrojs/sitemap has no access to the content collections, so the dates are
 * collected here at config time — 348 URLs shipped without a lastmod before this.
 */
const CONTENT_ROOT = fileURLToPath(new URL('./src/content/', import.meta.url));
const LASTMOD = new Map();
for (const collection of fs.readdirSync(CONTENT_ROOT)) {
  const dir = path.join(CONTENT_ROOT, collection);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8').slice(0, 4000);
    const updated = raw.match(/^updatedDate:\s*["']?([\d-]{10})/m);
    const published = raw.match(/^pubDate:\s*["']?([\d-]{10})/m);
    const date = (updated ?? published ?? [])[1];
    if (!date) continue;
    LASTMOD.set(`https://mexico-invest.com/${collection}/${file.replace(/\.mdx?$/, '')}/`, date);
  }
}
/** Newest entry date, used as lastmod for the hubs and the homepage. */
const NEWEST = [...LASTMOD.values()].sort().pop();

export default defineConfig({
  site: 'https://mexico-invest.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter(page) {
        const excluded = [
          '/thanks/',
          '/site-report/',
          '/guides/mexico-property-closing-costs-breakdown/',
          '/guides/invest-in-los-cabos/',
        ];
        return !excluded.some((path) => page.includes(path));
      },
      serialize(item) {
        const lastmod = LASTMOD.get(item.url) ?? NEWEST;
        item = lastmod ? { ...item, lastmod } : item;
        if (item.url === 'https://mexico-invest.com/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/guides/')) {
          return { ...item, priority: 0.85, changefreq: 'weekly' };
        }
        if (item.url.includes('/areas/') || item.url.includes('/compare/')) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        if (item.url.includes('/projects/')) {
          return { ...item, priority: 0.75, changefreq: 'weekly' };
        }
        if (item.url.includes('/developers/')) {
          return { ...item, priority: 0.72, changefreq: 'monthly' };
        }
        if (item.url.includes('/news/')) {
          return { ...item, priority: 0.65, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
