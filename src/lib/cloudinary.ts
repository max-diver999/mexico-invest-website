import dimensions from '../../scripts/data/cloudinary-image-dims.json';
import r2Widths from '../data/r2-image-widths.json';

const CLOUDINARY_PATTERN =
  /^https:\/\/res\.cloudinary\.com\/([a-z0-9]+)\/image\/upload\/(.+)$/;
const R2_PATTERN = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+?)(?:[?#].*)?$/i;
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
 * centre of a beach frame is sky, which is the reason heroes were arriving with the
 * horizon across the middle and the people cut off along the bottom edge.
 *
 * Two things fix that, and both are needed.
 *
 * The first is gravity: Cloudinary is asked for the region that carries the
 * subject (`g_auto`) rather than the geometric middle, so a family on the sand
 * survives a crop that would otherwise keep the empty sky above them.
 *
 * The second is the band itself. A fifth of the hero assets in this corpus are
 * portrait or near-square (phone frames, 2422x2560 stills) and no gravity
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

function publicIdFromR2(src: string): string | null {
  const match = R2_PATTERN.exec(src.trim());
  if (!match) return null;
  return match[1].replace(/\.webp$/i, '');
}

function lookupIntrinsic(publicId: string): ImageDimensions | undefined {
  const dims = dimensions as Record<string, ImageDimensions>;
  return (
    dims[publicId] ??
    dims[publicId.replace(/\/hero$/, '')] ??
    dims[`${publicId}/hero`]
  );
}

function heroFromStaticUrl(src: string, sizes: string) {
  const publicId = publicIdFromR2(src);
  if (!publicId) return null;

  const url = src.trim();
  const fromR2 = r2Responsive(url, sizes);
  /** Размер кадра: старая таблица Cloudinary, а если там пусто, манифест R2. */
  const intrinsic =
    lookupIntrinsic(publicId) ??
    (fromR2?.width && fromR2?.height ? { w: fromR2.width, h: fromR2.height } : undefined);
  const ratio = intrinsic?.w && intrinsic?.h ? intrinsic.w / intrinsic.h : undefined;
  const band = heroBandFor(ratio);

  /**
   * Список ширин только из манифеста. До 22.09.2026 здесь стояло одно `1280w`, и телефон на
   * любой странице статьи качал файл для компьютера.
   */
  const variants = (ar: string) => ({
    src: url,
    srcset: fromR2?.srcset ?? `${url} ${intrinsic?.w ?? 1280}w`,
    ar,
  });

  const narrow = variants(band.narrow);
  const wide = variants(band.wide);
  const [nw, nh] = band.narrow.split(':').map(Number);

  return {
    narrow,
    wide,
    sizes,
    narrowRatio: band.narrow.replace(':', ' / '),
    wideRatio: band.wide.replace(':', ' / '),
    width: intrinsic?.w ?? 1280,
    height: intrinsic?.h ?? Math.round((1280 * nh) / nw),
  };
}

/**
 * Обложка статьи, померено на живом сайте 22.09.2026: при экране 375 она 327 точек, при 700
 * ровно 644, при 900 ровно 828, шире 976 не бывает. Главная идёт во всю ширину экрана и передаёт
 * свой sizes сама.
 */
export const ARTICLE_HERO_SIZES =
  '(max-width: 767px) calc(100vw - 48px), (max-width: 1047px) calc(100vw - 72px), 976px';

export function heroCloudinary(src: string, sizes: string = ARTICLE_HERO_SIZES) {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return heroFromStaticUrl(src, sizes);

  const intrinsic = (dimensions as Record<string, ImageDimensions>)[parsed.publicId];
  const ratio = intrinsic?.w && intrinsic?.h ? intrinsic.w / intrinsic.h : undefined;
  const band = heroBandFor(ratio);

  /*
   * Never ask for more pixels than the asset holds. Some legacy heroes are only
   * 500px wide, and requesting 1600 of them buys an upscale: a soft picture at
   * three times the bytes. Widths above the source are dropped, and the largest
   * survivor becomes the default src.
   */
  const widths = intrinsic?.w
    ? (HERO_WIDTHS.filter((w) => w <= intrinsic.w).length
        ? HERO_WIDTHS.filter((w) => w <= intrinsic.w)
        : [intrinsic.w])
    : HERO_WIDTHS;

  const variants = (ar: string) => {
    const url = (width: number) =>
      cloudinaryUrl(src, `c_fill,g_auto,ar_${ar},w_${width},q_auto,f_auto`);
    return {
      src: url(widths[widths.length - 1]),
      srcset: widths.map((w) => `${url(w)} ${w}w`).join(', '),
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

const R2_HOST = 'pub-2855c73eea384110b510f25966292c37.r2.dev';
type R2Entry = { w: number; h: number; variants: number[] };

/**
 * Картинки, переехавшие на Cloudflare R2 с аккаунта Пхукета 22.09.2026.
 *
 * Раньше на любом не-Cloudinary адресе функция возвращала просто { src }: ни списка ширин, ни
 * размеров кадра. Замер до переезда: список районов отдавал 4441 КБ и телефону, и компьютеру,
 * и 963 КБ из них приходили сразу при открытии.
 *
 * Какие ширины реально залиты, знает манифест. Гадать нельзя: браузер попросит несуществующий
 * файл и получит 404 вместо картинки.
 */
export function r2Responsive(src: string, sizes: string = ARTICLE_SIZES) {
  const i = src.indexOf(R2_HOST);
  if (i < 0) return null;
  const key = src.slice(i + R2_HOST.length).replace(/^\//, '').split('?')[0];
  const entry = (r2Widths as Record<string, R2Entry>)[key];
  if (!entry) return null;
  const variants = (entry.variants || []).filter((w) => w < entry.w).sort((a, b) => a - b);
  const base = `https://${R2_HOST}/${key}`;
  if (!variants.length) return { src, width: entry.w, height: entry.h };
  return {
    src,
    srcset: [...variants.map((w) => `${base.replace(/\.webp$/i, `-w${w}.webp`)} ${w}w`), `${base} ${entry.w}w`].join(', '),
    sizes,
    width: entry.w,
    height: entry.h,
  };
}

export function responsiveCloudinary(src: string) {
  const fromR2 = r2Responsive(src);
  if (fromR2) return fromR2;

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
