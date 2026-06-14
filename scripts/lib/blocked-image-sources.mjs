/** Image source URLs that carry broker watermarks or wrong listing photos — hard-fail in validate. */

export const BLOCKED_IMAGE_PATTERNS = [
  { id: 'easybroker', test: (u) => u.includes('assets.easybroker.com') },
  { id: 'topmexico-listing', test: (u) => u.includes('photos.topmexicorealestate.com/Listings/') },
  { id: 'spark-resize', test: (u) => u.includes('cdn.resize.sparkplatform.com') },
  { id: 'broker-headshot', test: (u) => u.includes('topmexicorealestate.com/1-images/Brokers/') },
  { id: 'stock-airport', test: (u) => u.includes('mexicancaribbean.travel') },
  { id: 'lloyd-team', test: (u) => u.includes('lloyd-team.com') },
  { id: 'checkmark-asset', test: (u) => /\/checkM?\.png/i.test(u) },
  { id: 'thomas-lloyd', test: (u) => u.includes('thomas-lloyd') },
];

export const JUNK_IMAGE_PATTERNS = [
  { id: 'svg-icon', test: (u) => /\.svg(?:\?|$)/i.test(u) },
  { id: 'logo-asset', test: (u) => /logo|favicon|webclip|isotipo|grupoemerita|6927887a/i.test(u) },
  { id: 'ui-icon', test: (u) => /icon%20arrow|placeholder-image|estacionamiento|futbol|tenis|elevador|llaves/i.test(u) },
  { id: 'amenity-svg', test: (u) => /gimnasio|asolearse|regadera|seguridad|wifi\.svg|yoga\.svg|spa\.svg|playa\.svg|comida\.|eventos\./i.test(u) },
];

export function junkImageReason(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  for (const { id, test } of JUNK_IMAGE_PATTERNS) {
    if (test(u)) return id;
  }
  return null;
}

export function isJunkImageSource(url) {
  return Boolean(junkImageReason(url));
}

export function blockedImageReason(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  for (const { id, test } of BLOCKED_IMAGE_PATTERNS) {
    if (test(u)) return id;
  }
  return null;
}

export function isBlockedImageSource(url) {
  return Boolean(blockedImageReason(url));
}
