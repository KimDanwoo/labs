import { readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePostImage } from './lib/postImage.mjs';

const POSTS_DIR = fileURLToPath(new URL('../contents/posts/', import.meta.url));
const SOURCE_EXTENSION = /\.(jpe?g|png)$/i;
const THUMBNAIL_FILE = 'thumbnail.jpg';

export async function optimizePostImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));
  const sources = entries.filter(
    (entry) => entry.isFile() && SOURCE_EXTENSION.test(entry.name) && entry.name !== THUMBNAIL_FILE,
  );
  const targets = new Set();
  for (const { name } of sources) {
    const target = name.replace(SOURCE_EXTENSION, '.webp');
    if (names.has(target) || targets.has(target))
      throw new Error(`WebP 파일 이름이 겹칩니다: ${join(directory, target)}`);
    targets.add(target);
  }

  const markdownPath = join(directory, 'index.md');
  let markdown = await readFile(markdownPath, 'utf8');
  const conversions = [];
  for (const { name } of sources) {
    const input = await readFile(join(directory, name));
    const output = await encodePostImage(input);
    const target = name.replace(SOURCE_EXTENSION, '.webp');
    const reference = new RegExp(`(?<![\\w/.])\\./${RegExp.escape(name)}(?=[\\s)'"?#>]|$)`, 'g');
    markdown = markdown.replace(reference, () => `./${target}`);
    conversions.push({ name, target, output, before: input.length, after: output.length });
  }

  for (const { target, output } of conversions) {
    await writeFile(join(directory, target), output, { flag: 'wx' });
  }
  if (conversions.length > 0) await writeFile(markdownPath, markdown);
  for (const { name } of conversions) await unlink(join(directory, name));
  return conversions.map(({ name, before, after }) => ({ name, before, after }));
}

async function main() {
  const requested = process.argv.slice(2);
  if (requested.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    throw new Error('글 폴더 이름(slug)을 입력하세요.');
  }
  const entries = await readdir(POSTS_DIR, { withFileTypes: true });
  const slugs =
    requested.length > 0 ? requested : entries.filter((entry) => entry.isDirectory()).map(({ name }) => name);
  let count = 0;
  let before = 0;
  let after = 0;
  for (const slug of slugs) {
    const results = await optimizePostImages(join(POSTS_DIR, slug));
    for (const result of results) {
      count += 1;
      before += result.before;
      after += result.after;
    }
    if (results.length > 0) process.stdout.write(`${slug}: ${results.length}개 변환\n`);
  }
  const mib = (bytes) => (bytes / 1024 ** 2).toFixed(2);
  process.stdout.write(`WebP ${count}개: ${mib(before)} → ${mib(after)} MiB\n`);
}

if (import.meta.main) await main();
