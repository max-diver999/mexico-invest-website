import { r2Responsive } from './cloudinary';

/**
 * Карточка списка. Ширина слота померена на живой странице 22.09.2026: при экране 375 карточка
 * занимает 325 точек, при 900 ровно 403, при 1440 ровно 312.
 */
export const CARD_SIZES =
  '(max-width: 599px) calc(100vw - 50px), (max-width: 1023px) calc(50vw - 47px), 312px';

export type CardImage = { src: string; srcset?: string; sizes?: string; width?: number; height?: number };

/**
 * Квадратик у ссылки «читайте также»: 76 или 96 точек в ширину, около 197 в высоту, фото
 * вписывается по высоте. Честная ширина кадра под такой блок 350 точек, и на плотном экране
 * браузер брал файл 768 на каждый квадратик: шесть превью весили больше самой статьи (замер
 * 22.09.2026). Это декоративная миниатюра в самом низу страницы, ей хватает файла 360: на
 * обычном экране он точный, на плотном не хуже прежней обрезки Cloudinary 240 на 240.
 */
export const RELATED_SIZES = '176px';

/** Обложка страниц «О нас» и «Методика»: колонка max-w-3xl, на телефоне поля по 24 точки. */
export const PAGE_HERO_SIZES = '(max-width: 767px) calc(100vw - 48px), 720px';

const R2_SIZES: Record<string, string> = {
  card: CARD_SIZES,
  cardTall: CARD_SIZES,
  thumb: RELATED_SIZES,
  hero: PAGE_HERO_SIZES,
};

export function getCardImage(src: string | undefined, size: string = 'card'): CardImage | null {
  if (!src?.trim()) return null;
  const fromR2 = r2Responsive(src.trim(), R2_SIZES[size] ?? CARD_SIZES);
  if (fromR2) return fromR2;
  const url = getCardImageUrl(src, size as 'card' | 'hero');
  return url ? { src: url } : null;
}

/**
 * Card and hero thumbnail URLs: Cloudinary crop when available; external CDN as-is.
 *
 * The URL surgery lives in `cloudinary.ts`, which knows how to drop a transformation
 * segment the corpus already baked into a URL (`.../upload/w_1200,q_85,f_webp/v1/...`).
 * Inserting a second transform in front of the first chains them: Cloudinary crops to
 * our width and then upscales back to theirs, and the image arrives soft.
 */
import { cloudinaryUrl } from './cloudinary';

/*
 * Every entry crops, and a crop without a gravity is a crop to the geometric
 * centre. On a corpus of beach photographs that is the wrong half: the sky is
 * in the middle of the frame and the people are along the bottom, so a centred
 * band keeps the emptiest part of the picture and cuts the subject in half.
 * `g_auto` asks Cloudinary which region actually carries the image and crops to
 * that instead. It also ships fewer bytes, because the discarded sky was the
 * cheapest part of the file to keep.
 */
const SIZES = {
  card: 'w_640,h_360,c_fill,g_auto,q_auto,f_auto',
  /* A place reads by its verticals: water against a shoreline, a street, a
   * facade, so the area cards take a taller frame than the project ones. */
  cardTall: 'w_640,h_427,c_fill,g_auto,q_auto,f_auto',
  /* The square beside a link in the related rail: small, so it can be dense. */
  thumb: 'w_240,h_240,c_fill,g_auto,q_auto,f_auto',
  hero: 'w_1600,h_640,c_fill,g_auto,q_auto,f_auto',
  /** Hero photograph: a wide band, matched to the ~16:9 frames the corpus holds. */
  panel: 'w_1800,h_760,c_fill,g_auto,q_auto,f_auto',
} as const;

export type CardImageSize = keyof typeof SIZES;

export function getCardImageUrl(src: string | undefined, size: CardImageSize = 'card'): string {
  if (!src?.trim()) return '';
  return cloudinaryUrl(src.trim(), SIZES[size]);
}

export function formatAreaLabel(area?: string): string {
  if (!area) return '';
  return area
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatUsd(price?: number): string {
  if (!price || price <= 0) return '';
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(price / 1000)}K`;
}
