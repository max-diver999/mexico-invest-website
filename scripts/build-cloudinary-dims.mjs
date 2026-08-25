import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const config = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'performance-images.config.json'), 'utf8'),
);
const outputPath = path.join(ROOT, config.dimensionsCache);
const cloudinaryPattern =
  /https:\/\/res\.cloudinary\.com\/([a-z0-9]+)\/image\/upload\/([^"'\s)]+)/g;

function publicId(value) {
  const parts = value.split('/');
  while (
    parts.length > 1 &&
    (/^v\d+$/.test(parts[0]) || parts[0].includes(','))
  ) {
    parts.shift();
  }
  return parts.join('/').split('?')[0];
}

const images = new Map();
for (const collection of config.collections) {
  const directory = path.join(ROOT, 'src/content', collection);
  if (!fs.existsSync(directory)) continue;
  for (const filename of fs.readdirSync(directory)) {
    if (!filename.endsWith('.mdx') && !filename.endsWith('.md')) continue;
    const source = fs
      .readFileSync(path.join(directory, filename), 'utf8')
      .replace(/^---[\s\S]*?---/, '');
    for (const match of source.matchAll(cloudinaryPattern)) {
      images.set(publicId(match[2]), match[1]);
    }
  }
}

const cache = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
  : {};
const queue = [...images].filter(([id]) => !cache[id]);
let completed = 0;
let failed = 0;

async function worker() {
  while (queue.length) {
    const [id, cloud] = queue.shift();
    try {
      const response = await fetch(
        `https://res.cloudinary.com/${cloud}/image/upload/fl_getinfo/${id}`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const info = await response.json();
      const { width, height } = info.input || {};
      if (!width || !height) throw new Error('missing dimensions');
      cache[id] = { w: width, h: height };
      completed++;
    } catch {
      failed++;
    }
  }
}

await Promise.all(Array.from({ length: 10 }, worker));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(cache, null, 1)}\n`);
console.log(
  `[speed-kit] ${images.size} images, ${completed} cached, ${failed} failed, ${Object.keys(cache).length} total`,
);
if (failed) process.exitCode = 1;
