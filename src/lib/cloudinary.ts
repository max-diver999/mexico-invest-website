import dimensions from '../../scripts/data/cloudinary-image-dims.json';

const CLOUDINARY_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/([a-z0-9]+)\/image\/upload\/(.+)$/;
const CLOUDINARY_BASE = 'https://res.cloudinary.com';
const ARTICLE_WIDTHS = [640, 960, 1200];
const ARTICLE_SIZES = '(max-width: 768px) calc(100vw - 2rem), 72ch';
const TRANSFORM_PREFIX =
  /^(?:a|ac|ar|b|bl|bo|br|c|co|cs|d|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|if|ki|l|o|pg|q|r|so|t|u|vc|vs|w|x|y|z)_/;

type ImageDimensions = { w: number; h: number };

function isTransformSegment(segment: string): boolean {
  return segment.split(',').every((part) => TRANSFORM_PREFIX.test(part));
}

function parseCloudinaryUrl(src: string) {
  const match = CLOUDINARY_PATTERN.exec(src.trim());
  if (!match) return null;

  const [pathWithoutQuery] = match[2].split(/[?#]/, 1);
  const parts = pathWithoutQuery.split('/').filter(Boolean);
  const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));

  let deliveryParts: string[];
  let publicIdParts: string[];
  if (versionIndex >= 0) {
    deliveryParts = parts.slice(versionIndex);
    publicIdParts = parts.slice(versionIndex + 1);
  } else {
    let firstPublicId = 0;
    while (
      firstPublicId < parts.length - 1 &&
      isTransformSegment(parts[firstPublicId])
    ) {
      firstPublicId += 1;
    }
    deliveryParts = parts.slice(firstPublicId);
    publicIdParts = deliveryParts;
  }

  if (!publicIdParts.length) return null;
  return {
    cloud: match[1],
    publicId: publicIdParts.join('/'),
    deliveryPath: deliveryParts.join('/'),
  };
}

export function cloudinaryUrl(src: string, transform: string): string {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return src;
  return `${CLOUDINARY_BASE}/${parsed.cloud}/image/upload/${transform}/${parsed.deliveryPath}`;
}

/*
 * The article hero is a band: `w-full` against a capped height, which means the
 * browser crops it. Left to CSS the crop is centred, and on this corpus the
 * centre of a beach frame is sky — the reason heroes were arriving with the
 * horizon across the middle and the people cut off along the bottom edge.
 *
 * Two things fix that, and both are needed.
 *
 * The first is gravity: Cloudinary is asked for the region that carries the
 * subject (`g_auto`) rather than the geometric middle, so a family on the sand
 * survives a crop that would otherwise keep the empty sky above them.
 *
 * The second is the band itself. A fifth of the hero assets in this corpus are
 * portrait or near-square — phone frames, 2422x2560 stills — and no gravity
 * rescues a 0.47 photograph forced into a 2.33 slot; it keeps a fifth of the
 * picture whichever fifth it picks. So the band is chosen per image from the
 * asset's own shape: cinematic where there is width to spend, progressively
 * taller as the source approaches square. Nothing is cropped below roughly
 * two-thirds of its height, and the ratio delivered is the ratio displayed, so
 * the browser never crops a second time and the space is reserved before load.
 */
type HeroBand = { narrow: string; wide: string };

function heroBandFor(ratio: number | undefined): HeroBand {
  if (ratio === undefined) return { narrow: '16:10', wide: '21:9' };
  if (ratio >= 1.6) return { narrow: '16:10', wide: '21:9' };
  if (ratio >= 1.2) return { narrow: '16:10', wide: '2:1' };
  if (ratio >= 0.95) return { narrow: '4:3', wide: '16:9' };
  return { narrow: '4:3', wide: '3:2' };
}

const HERO_WIDTHS = [640, 960, 1280, 1600];

export function heroCloudinary(src: string) {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return null;

  const intrinsic = (dimensions as Record<string, ImageDimensions>)[parsed.publicId];
  const ratio = intrinsic?.w && intrinsic?.h ? intrinsic.w / intrinsic.h : undefined;
  const band = heroBandFor(ratio);

  const variants = (ar: string) => {
    const url = (width: number) =>
      cloudinaryUrl(src, `c_fill,g_auto,ar_${ar},w_${width},q_auto,f_auto`);
    return {
      src: url(HERO_WIDTHS[HERO_WIDTHS.length - 1]),
      srcset: HERO_WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
      ar,
    };
  };

  const narrow = variants(band.narrow);
  const wide = variants(band.wide);
  const [nw, nh] = band.narrow.split(':').map(Number);

  return {
    narrow,
    wide,
    sizes: '(max-width: 899px) 100vw, min(68rem, 100vw)',
    /* CSS ratios, so the box matches what was delivered at each breakpoint. */
    narrowRatio: band.narrow.replace(':', ' / '),
    wideRatio: band.wide.replace(':', ' / '),
    /* Intrinsic size of the <img> itself, which carries the narrow band. */
    width: 1600,
    height: Math.round((1600 * nh) / nw),
  };
}

export function responsiveCloudinary(src: string) {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return { src };

  const intrinsic = (dimensions as Record<string, ImageDimensions>)[parsed.publicId];
  const imageUrl = (width: number) =>
    cloudinaryUrl(src, `w_${width},q_auto:eco,f_auto`);

  return {
    src: imageUrl(ARTICLE_WIDTHS[ARTICLE_WIDTHS.length - 1]),
    srcset: ARTICLE_WIDTHS.map((width) => `${imageUrl(width)} ${width}w`).join(', '),
    sizes: ARTICLE_SIZES,
    width: intrinsic?.w,
    height: intrinsic?.h,
  };
}
