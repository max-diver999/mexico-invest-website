import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'performance-images.config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const dimsPath = path.join(ROOT, config.dimensionsCache);
const dimensions = fs.existsSync(dimsPath)
  ? JSON.parse(fs.readFileSync(dimsPath, 'utf8'))
  : {};

const cloudinaryPattern =
  /^https:\/\/res\.cloudinary\.com\/([a-z0-9]+)\/image\/upload\/(.+)$/;

function parseCloudinaryUrl(src) {
  const match = cloudinaryPattern.exec(src);
  if (!match) return null;
  const parts = match[2].split('/');
  while (
    parts.length > 1 &&
    (/^v\d+$/.test(parts[0]) || parts[0].includes(','))
  ) {
    parts.shift();
  }
  return {
    cloud: match[1],
    publicId: parts.join('/').split('?')[0],
    quality: /q_(\d+)/.exec(match[2])?.[1] ?? String(config.quality),
    original: src,
  };
}

function responsiveAttributes(src) {
  const parsed = parseCloudinaryUrl(src);
  if (!parsed) return null;
  const preserveOptimizedOriginal = /\.(webp|avif)$/i.test(parsed.publicId);
  const imageUrl = (width) =>
    `https://res.cloudinary.com/${parsed.cloud}/image/upload/w_${width},q_${parsed.quality},f_auto/${parsed.publicId}`;
  const intrinsic = dimensions[parsed.publicId];
  const largestWidth = Math.max(...config.widths);
  return {
    src: preserveOptimizedOriginal ? parsed.original : imageUrl(largestWidth),
    srcset: preserveOptimizedOriginal
      ? null
      : config.widths
          .map((width) => `${imageUrl(width)} ${width}w`)
          .join(', '),
    sizes: config.sizes,
    width: intrinsic ? String(intrinsic.w) : null,
    height: intrinsic ? String(intrinsic.h) : null,
  };
}

export function rehypeResponsiveCloudinary() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const attrs = responsiveAttributes(String(node.properties?.src || ''));
      if (!attrs) return;
      node.properties.src = attrs.src;
      if (attrs.srcset && !node.properties.srcset) {
        node.properties.srcset = attrs.srcset;
        node.properties.sizes = node.properties.sizes || attrs.sizes;
      }
      if (attrs.width && !node.properties.width) {
        node.properties.width = attrs.width;
        node.properties.height = attrs.height;
      }
    });

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      if (node.name !== 'img') return;
      const findAttribute = (name) =>
        node.attributes.find(
          (attribute) =>
            attribute.type === 'mdxJsxAttribute' && attribute.name === name,
        );
      const src = findAttribute('src');
      if (!src || typeof src.value !== 'string') return;
      const attrs = responsiveAttributes(src.value);
      if (!attrs) return;
      src.value = attrs.src;
      const add = (name, value) => {
        if (!findAttribute(name)) {
          node.attributes.push({ type: 'mdxJsxAttribute', name, value });
        }
      };
      if (attrs.srcset) {
        add('srcset', attrs.srcset);
        add('sizes', attrs.sizes);
      }
      if (attrs.width) {
        add('width', attrs.width);
        add('height', attrs.height);
      }
    });
  };
}
