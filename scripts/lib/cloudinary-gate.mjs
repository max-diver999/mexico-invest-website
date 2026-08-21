/**
 * Cloudinary delivery checks for MDX image URLs.
 *
 * Previously imported from `../../../scripts/lib/cloudinary-gate.mjs` — a path that
 * resolves outside the repository and never existed here, so `validate:content`
 * crashed with ERR_MODULE_NOT_FOUND on every invocation and the "337/337 clean"
 * baseline was never a measurement. This is the real implementation.
 *
 * Scope: only the delivery URL itself. Whether a host is allowed at all is
 * `blocked-image-sources.mjs`; whether the URL responds 200 is `audit-all-images.mjs`.
 */

/** Cloudinary delivery URL: https://res.cloudinary.com/<cloud>/image/upload/<transforms>/<version>/<path> */
const CLOUDINARY_RE = /https?:\/\/res\.cloudinary\.com\/[^/\s)"']+\/image\/upload\/[^\s)"']+/g;

/** Transform segment sits between /upload/ and the version (v1234567890) or the public id. */
function transformsOf(url) {
  const after = url.split('/image/upload/')[1] ?? '';
  const first = after.split('/')[0] ?? '';
  // A transform segment is a comma-list of `k_v` pairs; a version is `v` + digits.
  if (/^v\d+$/.test(first)) return '';
  if (!/^[a-z]{1,3}_/.test(first)) return '';
  return first;
}

/**
 * @param {object} o
 * @param {string} o.prefix        "[collection/slug]" label for error lines
 * @param {string} o.text          full file text (frontmatter + body)
 * @param {string[]} o.errors      mutated in place
 * @param {boolean} [o.legacyExempt] skip the advisory checks for grandfathered files
 */
export function runCloudinaryDeliveryChecks({ prefix, text, errors, legacyExempt = false }) {
  const urls = [...new Set(text.match(CLOUDINARY_RE) ?? [])];
  if (urls.length === 0) return;

  for (const url of urls) {
    // Broken interpolation or a placeholder that shipped.
    if (/\{|\}|\$\{|<[A-Za-z]/.test(url)) {
      errors.push(`${prefix} Cloudinary URL contains unresolved template syntax: ${url.slice(0, 90)}`);
      continue;
    }
    if (/\/upload\/(?:$|[?#])/.test(url) || /\/upload\/\/{1,}/.test(url)) {
      errors.push(`${prefix} malformed Cloudinary URL (empty path after /upload/): ${url.slice(0, 90)}`);
      continue;
    }
    if (/\s/.test(url)) {
      errors.push(`${prefix} Cloudinary URL contains whitespace — encode it: ${url.slice(0, 90)}`);
      continue;
    }

    const transforms = transformsOf(url);

    // Double transform blocks (…/upload/w_1200/w_960/…) deliver the wrong size and cost two derivations.
    const segments = (url.split('/image/upload/')[1] ?? '').split('/');
    const transformLike = segments.filter((s) => /^[a-z]{1,3}_[^/]+$/.test(s) && !/^v\d+$/.test(s));
    if (transformLike.length > 1) {
      errors.push(`${prefix} Cloudinary URL has ${transformLike.length} transform segments — keep one: ${url.slice(0, 90)}`);
      continue;
    }

    if (legacyExempt) continue;

    // Delivery hygiene: an untransformed original is the full-size upload.
    if (!transforms) {
      errors.push(`${prefix} Cloudinary URL delivers the untransformed original — add w_/q_/f_: ${url.slice(0, 90)}`);
      continue;
    }
    if (!/\bw_\d+/.test(transforms)) {
      errors.push(`${prefix} Cloudinary URL has no width transform (w_): ${url.slice(0, 90)}`);
    }
    if (!/\bf_(auto|webp|avif)\b/.test(transforms)) {
      errors.push(`${prefix} Cloudinary URL has no modern format transform (f_webp/f_auto): ${url.slice(0, 90)}`);
    }
    if (!/\bq_(auto|\d+)/.test(transforms)) {
      errors.push(`${prefix} Cloudinary URL has no quality transform (q_): ${url.slice(0, 90)}`);
    }
    const w = Number((transforms.match(/\bw_(\d+)/) ?? [])[1] ?? 0);
    if (w > 2000) {
      errors.push(`${prefix} Cloudinary width w_${w} is larger than any rendered slot (max 1200): ${url.slice(0, 90)}`);
    }
  }
}

export default { runCloudinaryDeliveryChecks };
