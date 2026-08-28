/** Editorial picks for homepage featured grids (order preserved). */
export const FEATURED_PROJECT_SLUGS = [
  'gran-tulum',
  'distrito-xcalacoco-beach',
  'st-regis-residences-los-cabos',
  'four-seasons-punta-mita',
  'pendry-punta-mita',
  'tao-blue-gardens-pv',
  'amara-tulum',
  'kabana-aldea-zama',
  'copala-quivira',
  'chileno-bay-residences',
  'montage-punta-mita',
  'paravian-playa',
] as const;

/** Hero spotlight: links to full project review from homepage banner. */
export const HOMEPAGE_HERO_PROJECT_SLUG = 'duna-tulum' as const;

export const FEATURED_GUIDE_SLUGS = [
  'mexico-property-investment-guide',
  'buy-property-mexico-foreigner',
  'fideicomiso-mexico-explained',
  'riviera-maya-property-investment-guide',
] as const;

export const FEATURED_AREA_SLUGS = [
  'tulum',
  'playa-del-carmen',
  'cabo-san-lucas',
  'puerto-vallarta',
] as const;

/**
 * Homepage hero photograph. It must show the building named on the hero plate;
 * the picture is evidence for one project, not stock mood. The project's own
 * `heroImage` is not always the best frame in its gallery, so the pick is explicit.
 */
export const HOMEPAGE_HERO_IMAGE =
  'https://res.cloudinary.com/dphvjbqb4/image/upload/v1781470304/more-group/mexico/projects/duna-tulum/inline_1.webp';
