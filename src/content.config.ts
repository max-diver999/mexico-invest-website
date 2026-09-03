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
  /**
   * Set when the page deliberately has no hero because the only art available
   * was broken: an 11x629 sliver, a blank plate, or a frame of somewhere else.
   * A page with no picture is honest; one with a broken picture is not. The
   * corpus gate treats these as pending rather than as a lost hero, so they stay
   * visible as work without failing the build.
   */
  heroPending: z.boolean().optional(),
  /**
   * Shown under the hero. Use it whenever the frame is not our own photograph:
   * marketing art from a developer's brochure, an architectural render, or a
   * picture of a different development. The reader should not have to guess
   * whether a number baked into an image is ours or the seller's.
   */
  heroCredit: z.string().optional(),
  /**
   * Set when the page still shares its hero with another page because it owns
   * no unique frame of its own. Reported by the corpus gate as a debt for the
   * photo wave, not as a defect to paper over.
   */
  heroShared: z.boolean().optional(),
  /** Descriptive alt for the hero. Falls back to a phrase built from title + area. */
  heroAlt: z.string().optional(),
  /**
   * What the page is called on a listing card, where the title sits under a
   * photograph and has a line and a half to work in. The <title> and the <h1>
   * still carry the keyword the page ranks on; this carries the name a reader
   * recognises. Unset falls back to title, so a page without one is not broken.
   */
  cardTitle: z.string().optional(),
  readingTime: z.number().optional(),
  relatedSlugs: z.array(z.string()).default([]),
  noindex: z.boolean().default(false),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

const projectSchema = articleSchema.extend({
  priceFromUsd: z.number().optional(),
  priceToUsd: z.number().optional(),
  area: z.string().optional(),
  developer: z.string().optional(),
  propertyType: z.string().optional(),
  status: z.string().optional(),
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
  projects: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: projectSchema,
  }),
  developers: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/developers' }),
    schema: articleSchema,
  }),
  news: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
    schema: articleSchema,
  }),
};
