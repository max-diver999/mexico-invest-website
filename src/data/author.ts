/**
 * Article authorship.
 *
 * Article.author is currently an Organization. For YMYL content — foreign property
 * law, cross-border tax — a named Person with real credentials is the stronger E-E-A-T
 * signal, but only when a real person stands behind it. Inventing an expert would be
 * worse than the Organization byline, not better.
 *
 * To switch: fill in PERSON below and set USE_PERSON = true. Nothing else changes —
 * the schema, the byline and the /about/ link all read from here.
 */
import { SITE } from './site';

export const USE_PERSON = false;

/** Populate with a real named author before flipping USE_PERSON. */
export const PERSON = {
  name: '',
  /** e.g. 'Independent property investment researcher, covering Mexico since 2025' */
  jobTitle: '',
  /** Short credential sentence rendered under the byline. */
  bio: '',
  /** Profile URL — /about/ anchor, LinkedIn, or both. */
  url: `${SITE.url}/about/`,
  sameAs: [] as string[],
};

export const ORGANIZATION_AUTHOR = {
  name: SITE.editorial,
  url: `${SITE.url}/about/`,
};

export const AUTHOR = USE_PERSON && PERSON.name ? PERSON : ORGANIZATION_AUTHOR;

/**
 * schema.org author node for Article/NewsArticle.
 * `name` lets a page override the byline while keeping the right @type.
 */
export function authorSchema(name?: string) {
  const useName = name || AUTHOR.name;
  if (USE_PERSON && PERSON.name) {
    return {
      '@type': 'Person',
      name: useName,
      ...(PERSON.jobTitle ? { jobTitle: PERSON.jobTitle } : {}),
      url: PERSON.url,
      ...(PERSON.sameAs.length ? { sameAs: PERSON.sameAs } : {}),
    };
  }
  return {
    '@type': 'Organization',
    name: useName,
    url: ORGANIZATION_AUTHOR.url,
  };
}
