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

function cloudinaryDeliveryUrl(src: string, transform: string): string {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return src;
  return `${CLOUDINARY_BASE}/${parsed.cloud}/image/upload/${transform}/${parsed.deliveryPath}`;
}

export function responsiveCloudinary(src: string) {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return { src };

  const intrinsic = (dimensions as Record<string, ImageDimensions>)[parsed.publicId];
  const imageUrl = (width: number) =>
    cloudinaryDeliveryUrl(src, `w_${width},q_auto:eco,f_auto`);

  return {
    src: imageUrl(ARTICLE_WIDTHS[ARTICLE_WIDTHS.length - 1]),
    srcset: ARTICLE_WIDTHS.map((width) => `${imageUrl(width)} ${width}w`).join(', '),
    sizes: ARTICLE_SIZES,
    width: intrinsic?.w,
    height: intrinsic?.h,
  };
}
