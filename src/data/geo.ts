/**
 * Geographic taxonomy for the content graph.
 *
 * Body copy links a page to whatever the writer happened to mention. This maps the
 * relationships the copy never states — which market an area belongs to, which area a
 * project sits in, which developer built it — so `content-graph.ts` can resolve
 * project <-> area <-> developer <-> market links deterministically.
 *
 * `AREA_SLUGS` are entries in src/content/areas; `MARKET` groups them the way a buyer
 * shops, which is not the way Mexico is administratively divided (the Vallarta corridor
 * straddles Jalisco and Nayarit, and buyers treat it as one market).
 */

export type MarketSlug =
  | 'riviera-maya'
  | 'los-cabos'
  | 'vallarta-nayarit'
  | 'yucatan-gulf'
  | 'pacific'
  | 'inland';

export const MARKET_LABEL: Record<MarketSlug, string> = {
  'riviera-maya': 'Riviera Maya and Quintana Roo',
  'los-cabos': 'Los Cabos and Baja California Sur',
  'vallarta-nayarit': 'Puerto Vallarta and Riviera Nayarit',
  'yucatan-gulf': 'Yucatán and the Gulf',
  pacific: 'Pacific coast',
  inland: 'Inland Mexico',
};

/** Every entry in src/content/areas, mapped to the market a buyer shops it in. */
export const AREA_MARKET: Record<string, MarketSlug> = {
  akumal: 'riviera-maya',
  'aldea-zama-tulum': 'riviera-maya',
  'bacalar-investment': 'riviera-maya',
  cancun: 'riviera-maya',
  'cozumel-investment': 'riviera-maya',
  'gonzalo-guerrero-playa': 'riviera-maya',
  'holistika-tulum': 'riviera-maya',
  'la-veleta-tulum': 'riviera-maya',
  'north-shore-xcalacoco': 'riviera-maya',
  'playa-del-carmen': 'riviera-maya',
  playacar: 'riviera-maya',
  'puerto-aventuras': 'riviera-maya',
  'puerto-morelos': 'riviera-maya',
  'region-15-tulum': 'riviera-maya',
  'region-8-tulum': 'riviera-maya',
  'tankah-bay': 'riviera-maya',
  'tulum-beach-zone': 'riviera-maya',
  'tulum-country-club': 'riviera-maya',
  'tulum-pueblo-east': 'riviera-maya',
  tulum: 'riviera-maya',
  'zazil-ha-playa': 'riviera-maya',

  'cabo-corridor': 'los-cabos',
  'cabo-san-lucas': 'los-cabos',
  'east-cape-baja': 'los-cabos',
  'san-jose-del-cabo': 'los-cabos',

  bucerias: 'vallarta-nayarit',
  'nuevo-vallarta': 'vallarta-nayarit',
  'puerto-vallarta': 'vallarta-nayarit',
  'punta-de-mita': 'vallarta-nayarit',
  sayulita: 'vallarta-nayarit',

  merida: 'yucatan-gulf',

  'san-miguel-de-allende-property': 'inland',
};

/** Area entries that exist as pages, derived once so lookups stay cheap. */
export const AREA_SLUGS = Object.keys(AREA_MARKET);

/**
 * `projectSchema.area` values that do not match an area page slug one-for-one.
 * Anything not listed here is assumed to be an area slug already.
 */
const PROJECT_AREA_ALIAS: Record<string, string> = {
  bacalar: 'bacalar-investment',
  cozumel: 'cozumel-investment',
  'punta-mita': 'punta-de-mita',
  'riviera-nayarit': 'nuevo-vallarta',
};

/** Project `area` values with no area page of their own, mapped to a market directly. */
const ORPHAN_PROJECT_AREA_MARKET: Record<string, MarketSlug> = {
  campeche: 'yucatan-gulf',
  holbox: 'riviera-maya',
};

/** The area page a project belongs to, or null when only its market is known. */
export function areaForProject(data: Record<string, any>): string | null {
  const raw = String(data?.area ?? '').trim().toLowerCase();
  if (!raw) return null;
  const alias = PROJECT_AREA_ALIAS[raw] ?? raw;
  return AREA_SLUGS.includes(alias) ? alias : null;
}

/** The market a project belongs to, resolved through its area where possible. */
export function marketForProject(data: Record<string, any>): MarketSlug | null {
  const area = areaForProject(data);
  if (area) return AREA_MARKET[area] ?? null;
  const raw = String(data?.area ?? '').trim().toLowerCase();
  return ORPHAN_PROJECT_AREA_MARKET[raw] ?? null;
}

export function marketForArea(slug: string): MarketSlug | null {
  return AREA_MARKET[slug] ?? null;
}

/**
 * Developer entries in src/content/developers, keyed by the `developer` string that
 * project frontmatter uses. Only developers with a page of their own are listed;
 * everything else ("Local", "Various boutique developers") resolves to nothing.
 */
export const DEVELOPER_PAGE: Record<string, string> = {
  simca: 'simca-desarrollos',
  'grupo emerita': 'grupo-emerita',
  emerita: 'grupo-emerita',
  'tao mexico': 'tao-mexico',
  tao: 'tao-mexico',
  quivira: 'quivira-los-cabos',
  'quivira los cabos': 'quivira-los-cabos',
  querencia: 'querencia-los-cabos',
  'zamá desarrollos': 'zama-desarrollos',
  'zama desarrollos': 'zama-desarrollos',
  vidanta: 'vidanta-nuevo-vallarta',
  'dine / montage': 'dine-montage-punta-mita',
  dine: 'dine-montage-punta-mita',
  'tm real estate group': 'tm-real-estate-group',
  'tm real estate': 'tm-real-estate-group',
};

export function developerPageFor(data: Record<string, any>): string | null {
  const raw = String(data?.developer ?? '').trim().toLowerCase();
  if (!raw) return null;
  if (DEVELOPER_PAGE[raw]) return DEVELOPER_PAGE[raw];
  // "SIMCA Desarrollos", "Quivira (Los Cabos)" — match on the leading token set.
  for (const [key, page] of Object.entries(DEVELOPER_PAGE)) {
    if (raw.startsWith(key)) return page;
  }
  return null;
}

/** The market guide that anchors each market, used as a fallback related link. */
export const MARKET_GUIDE: Record<MarketSlug, string> = {
  'riviera-maya': 'riviera-maya-property-investment-guide',
  'los-cabos': 'los-cabos-property-investment-guide',
  'vallarta-nayarit': 'puerto-vallarta-property-investment-guide',
  'yucatan-gulf': 'mexico-property-investment-guide',
  pacific: 'mexico-beachfront-property-investment',
  inland: 'mexico-property-investment-guide',
};
