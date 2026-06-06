import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().default('Mexico Invest Editorial'),
  category: z.string().default('guides'),
  tags: z.array(z.string()).default([]),
  heroImage: z.string().optional(),
  readingTime: z.number().optional(),
  relatedSlugs: z.array(z.string()).default([]),
  noindex: z.boolean().default(false),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

export const collections = {
  guides: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
    schema: articleSchema,
  }),
  compare: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/compare' }),
    schema: articleSchema,
  }),
  areas: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/areas' }),
    schema: articleSchema,
  }),
};
