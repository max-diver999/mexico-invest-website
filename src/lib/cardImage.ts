/**
 * Card and hero thumbnail URLs — Cloudinary crop when available; external CDN as-is.
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
  card: 'w_800,h_450,c_fill,g_auto,q_auto,f_auto',
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
