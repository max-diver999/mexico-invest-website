import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

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
        return !page.includes('/thanks/') && !page.includes('/site-report/');
      },
      serialize(item) {
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
        return { ...item, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
