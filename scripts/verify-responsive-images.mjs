import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputRoots = [
  path.join(root, 'dist'),
  path.join(root, '.vercel/output/static'),
].filter((directory) => fs.existsSync(directory));

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else if (entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

const files = outputRoots.flatMap((directory) => walk(directory));
let cloudinaryImages = 0;
let responsiveImages = 0;
let missingDimensions = 0;

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const image = match[0];
    if (!image.includes('res.cloudinary.com/')) continue;
    cloudinaryImages++;
    if (/\ssrcset=/.test(image) && /\ssizes=/.test(image)) responsiveImages++;
    if (!/\swidth=/.test(image) || !/\sheight=/.test(image)) missingDimensions++;
  }
}

console.log(
  `[speed-kit] HTML pages=${files.length}, Cloudinary images=${cloudinaryImages}, responsive=${responsiveImages}, missing dimensions=${missingDimensions}`,
);
if (
  !files.length ||
  !cloudinaryImages ||
  !responsiveImages ||
  missingDimensions
) {
  process.exitCode = 1;
}
