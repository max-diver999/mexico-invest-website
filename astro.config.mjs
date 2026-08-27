import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import referenceConfig from './reference-infra.config.json' with { type: 'json' };
import { collectContentLastmod } from './scripts/reference-infra/content-lastmod.mjs';
import { rehypeResponsiveCloudinary } from './scripts/rehype-responsive-cloudinary.mjs';
import { rehypeTableScroll } from './scripts/rehype-table-scroll.mjs';

const contentLastmod = await collectContentLastmod(referenceConfig, { root: process.cwd() });
const lastmodByUrl = new Map(contentLastmod.map((item) => [item.url, item.lastmod]));

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
        const lastmod = lastmodByUrl.get(item.url);
        item = lastmod
          ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) }
          : item;
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
    mdx({
      rehypePlugins: [rehypeResponsiveCloudinary, rehypeTableScroll],
    }),
  ],
});
