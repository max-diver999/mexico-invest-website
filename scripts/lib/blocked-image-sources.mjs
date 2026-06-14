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
