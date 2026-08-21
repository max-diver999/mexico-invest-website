/**
 * Resolve the internal links a page should offer.
 *
 * Two independent layers:
 *  1. `resolveRelatedSlugs` — the hand-curated `relatedSlugs` frontmatter. All 337
 *     files carry it, 1,746 entries in total, none of them broken, and until now
 *     nothing rendered it.
 *  2. `resolveRelatedEntities` — deterministic cross-collection siblings resolved
 *     from the geo taxonomy (project <-> area <-> developer <-> market), which body
 *     copy never links because a writer only links what they happened to mention.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  AREA_MARKET,
  MARKET_GUIDE,
  MARKET_LABEL,
  areaForProject,
  developerPageFor,
  marketForArea,
  marketForProject,
  type MarketSlug,
} from '../data/geo';

export type CollectionName = 'guides' | 'projects' | 'compare' | 'areas' | 'news' | 'developers';

export interface LinkCard {
  url: string;
  title: string;
  description: string;
  collection: CollectionName;
  label: string;
}

const ROUTED: CollectionName[] = ['guides', 'projects', 'compare', 'areas', 'news', 'developers'];

export const COLLECTION_LABEL: Record<CollectionName, string> = {
  guides: 'Guide',
  projects: 'Project',
  compare: 'Comparison',
  areas: 'Area',
  news: 'Market note',
  developers: 'Developer',
};

interface IndexedEntry {
  slug: string;
  collection: CollectionName;
  title: string;
  description: string;
  data: Record<string, any>;
}

let cache: IndexedEntry[] | null = null;

/** Flat index of every routed, indexable entry. Built once per build. */
async function index(): Promise<IndexedEntry[]> {
  if (cache) return cache;
  const all: IndexedEntry[] = [];
  for (const collection of ROUTED) {
    const entries = (await getCollection(collection as any)) as unknown as CollectionEntry<'guides'>[];
    for (const entry of entries) {
      if (entry.data.noindex) continue;
      all.push({
        slug: entry.id,
        collection,
        title: entry.data.title,
        description: entry.data.description,
        data: entry.data,
      });
    }
  }
  cache = all;
  return all;
}

function toCard(e: IndexedEntry): LinkCard {
  return {
    url: `/${e.collection}/${e.slug}/`,
    title: e.title,
    description: e.description,
    collection: e.collection,
    label: COLLECTION_LABEL[e.collection],
  };
}

/**
 * Layer 1 — the curated `relatedSlugs`. Slugs are unique corpus-wide with four
 * exceptions (holistika-tulum, tankah-bay, tulum-country-club, vidanta-nuevo-vallarta
 * exist in two collections each), so a same-collection match wins before a global one.
 */
export async function resolveRelatedSlugs(
  slugs: string[] | undefined,
  selfSlug: string,
  selfCollection?: CollectionName,
): Promise<LinkCard[]> {
  if (!slugs?.length) return [];
  const all = await index();
  const out: LinkCard[] = [];
  const seen = new Set<string>([`${selfCollection}/${selfSlug}`]);
  for (const slug of slugs) {
    const hit =
      all.find((e) => e.slug === slug && e.collection === selfCollection) ??
      all.find((e) => e.slug === slug);
    if (!hit) continue;
    const key = `${hit.collection}/${hit.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(toCard(hit));
  }
  return out;
}

function pick(
  all: IndexedEntry[],
  collection: CollectionName,
  match: (e: IndexedEntry) => boolean,
  n: number,
  exclude: Set<string>,
): LinkCard[] {
  return all
    .filter((e) => e.collection === collection && !exclude.has(`${e.collection}/${e.slug}`) && match(e))
    .slice(0, n)
    .map(toCard);
}

/**
 * Layer 2 — cross-collection siblings from the geo taxonomy. This is what closes the
 * project <-> area <-> developer gaps, and it is why the orphaned project and area
 * pages stop being orphans.
 */
export async function resolveRelatedEntities(
  collection: CollectionName,
  slug: string,
  data: Record<string, any>,
  alreadyLinked: LinkCard[] = [],
): Promise<{ heading: string; note?: string; cards: LinkCard[] }> {
  const all = await index();
  const exclude = new Set<string>([
    `${collection}/${slug}`,
    ...alreadyLinked.map((c) => {
      const [, col, s] = c.url.split('/');
      return `${col}/${s}`;
    }),
  ]);
  const cards: LinkCard[] = [];

  const areaCard = (area: string) => pick(all, 'areas', (e) => e.slug === area, 1, exclude);
  const guideCard = (guide: string) => pick(all, 'guides', (e) => e.slug === guide, 1, exclude);
  const developerCard = (dev: string) => pick(all, 'developers', (e) => e.slug === dev, 1, exclude);
  const projectsInArea = (area: string, n: number) =>
    pick(all, 'projects', (e) => areaForProject(e.data) === area, n, exclude);
  const projectsInMarket = (market: MarketSlug, n: number) =>
    pick(all, 'projects', (e) => marketForProject(e.data) === market, n, exclude);
  const areasInMarket = (market: MarketSlug, n: number) =>
    pick(all, 'areas', (e) => AREA_MARKET[e.slug] === market, n, exclude);
  const comparesMentioning = (needle: string, n: number) =>
    pick(all, 'compare', (e) => e.slug.includes(needle), n, exclude);
  const newsMentioning = (needle: string, n: number) =>
    pick(all, 'news', (e) => e.slug.includes(needle), n, exclude);

  let heading = 'Related research';
  let note: string | undefined;

  if (collection === 'projects') {
    heading = 'The area, the developer and comparable projects';
    note = 'Resolved from this project’s market and developer, not from the copy above.';
    const area = areaForProject(data);
    const market = marketForProject(data);
    const developer = developerPageFor(data);
    if (developer) cards.push(...developerCard(developer));
    if (area) cards.push(...areaCard(area));
    if (area) cards.push(...projectsInArea(area, 3));
    if (market) {
      cards.push(...guideCard(MARKET_GUIDE[market]));
      if (cards.length < 5) cards.push(...projectsInMarket(market, 5 - cards.length));
    }
  } else if (collection === 'areas') {
    heading = 'Projects, comparisons and rules in this market';
    const market = marketForArea(slug);
    cards.push(...projectsInArea(slug, 3));
    cards.push(...comparesMentioning(slug.split('-')[0], 2));
    if (market) {
      cards.push(...guideCard(MARKET_GUIDE[market]));
      cards.push(...areasInMarket(market, 2));
    }
    cards.push(...newsMentioning(slug.split('-')[0], 1));
  } else if (collection === 'developers') {
    heading = 'Projects by this developer';
    note = 'Every project page on this site that names this developer.';
    cards.push(...pick(all, 'projects', (e) => developerPageFor(e.data) === slug, 6, exclude));
    cards.push(...guideCard('developer-due-diligence-mexico'));
  } else if (collection === 'compare') {
    heading = 'The pages behind this comparison';
    for (const part of slug.split('-vs-')) {
      const key = part.replace(/-investment$|-luxury$|-property$/, '');
      cards.push(...pick(all, 'areas', (e) => e.slug === key || e.slug.startsWith(key), 1, exclude));
      cards.push(...pick(all, 'projects', (e) => e.slug === key || e.slug.startsWith(key), 1, exclude));
    }
  } else if (collection === 'news') {
    heading = 'The evergreen guides behind this update';
    note = 'A dated note is only useful next to the rules it changes.';
    for (const [area, market] of Object.entries(AREA_MARKET)) {
      if (!slug.includes(area.split('-')[0])) continue;
      cards.push(...areaCard(area));
      cards.push(...guideCard(MARKET_GUIDE[market]));
      break;
    }
  }

  const seen = new Set<string>();
  const unique = cards.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
  return { heading, note, cards: unique.slice(0, 8) };
}

export { MARKET_LABEL };
