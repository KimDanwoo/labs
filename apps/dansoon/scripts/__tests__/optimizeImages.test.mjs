import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { optimizePostImages } from '../optimizeImages.mjs';

async function createPost(t, markdown) {
  const directory = await mkdtemp(join(tmpdir(), 'dansoon-images-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, 'index.md'), markdown);
  return directory;
}

const image = () => sharp({ create: { width: 32, height: 24, channels: 4, background: '#487bac80' } });

test('본문·커버 경로를 바꾸고 PNG 픽셀·투명도와 JPG 썸네일을 보존한다', async (t) => {
  const directory = await createPost(
    t,
    [
      '---',
      "cover: './cover.jpg'",
      "thumbnail: './thumbnail.jpg'",
      '---',
      '![캡처](./screen+1.png)',
      '<img src="./screen+1.png">',
      '[원본](./screen+1.png?download=1)',
      '![외부](https://example.com/screen+1.png)',
      '![다른 글](../screen+1.png)',
      '[다른 파일](./screen+1.png.backup)',
      '![벡터](./diagram.svg)',
    ].join('\n'),
  );
  const jpeg = await image().jpeg().toBuffer();
  const png = await image().png().toBuffer();
  const webp = await image().webp().toBuffer();
  await writeFile(join(directory, 'cover.jpg'), jpeg);
  await writeFile(join(directory, 'screen+1.png'), png);
  await writeFile(join(directory, 'thumbnail.jpg'), jpeg);
  await writeFile(join(directory, 'existing.webp'), webp);
  await writeFile(join(directory, 'diagram.svg'), '<svg/>');

  assert.equal((await optimizePostImages(directory)).length, 2);
  const markdown = await readFile(join(directory, 'index.md'), 'utf8');
  assert.ok(markdown.includes("cover: './cover.webp'"));
  assert.ok(markdown.includes("thumbnail: './thumbnail.jpg'"));
  assert.ok(markdown.includes('![캡처](./screen+1.webp)'));
  assert.ok(markdown.includes('<img src="./screen+1.webp">'));
  assert.ok(markdown.includes('[원본](./screen+1.webp?download=1)'));
  assert.ok(markdown.includes('https://example.com/screen+1.png'));
  assert.ok(markdown.includes('../screen+1.png'));
  assert.ok(markdown.includes('./screen+1.png.backup'));
  assert.deepEqual(await readFile(join(directory, 'thumbnail.jpg')), jpeg);
  assert.deepEqual(await readFile(join(directory, 'existing.webp')), webp);
  assert.equal(await readFile(join(directory, 'diagram.svg'), 'utf8'), '<svg/>');
  assert.deepEqual(
    await sharp(join(directory, 'screen+1.webp')).ensureAlpha().raw().toBuffer(),
    await sharp(png).ensureAlpha().raw().toBuffer(),
  );
  const metadata = await sharp(join(directory, 'cover.webp')).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 32);
  assert.equal(metadata.height, 24);
  assert.ok(!(await readdir(directory)).includes('cover.jpg'));
  assert.ok(!(await readdir(directory)).includes('screen+1.png'));

  const converted = await readFile(join(directory, 'cover.webp'));
  assert.deepEqual(await optimizePostImages(directory), []);
  assert.deepEqual(await readFile(join(directory, 'cover.webp')), converted);
  assert.equal(await readFile(join(directory, 'index.md'), 'utf8'), markdown);
});

test('기존 WebP와 이름이 겹치면 원본과 경로를 유지한다', async (t) => {
  const markdown = '![캡처](./screen.png)';
  const directory = await createPost(t, markdown);
  const png = await image().png().toBuffer();
  const webp = await image().webp().toBuffer();
  await writeFile(join(directory, 'screen.png'), png);
  await writeFile(join(directory, 'screen.webp'), webp);

  await assert.rejects(optimizePostImages(directory), /이름이 겹칩니다/);
  assert.deepEqual(await readFile(join(directory, 'screen.png')), png);
  assert.deepEqual(await readFile(join(directory, 'screen.webp')), webp);
  assert.equal(await readFile(join(directory, 'index.md'), 'utf8'), markdown);
});

test('같은 이름의 JPG·PNG가 있으면 변환 전에 중단한다', async (t) => {
  const directory = await createPost(t, '![사진](./photo.jpg)\n![캡처](./photo.png)');
  await writeFile(join(directory, 'photo.jpg'), await image().jpeg().toBuffer());
  await writeFile(join(directory, 'photo.png'), await image().png().toBuffer());

  await assert.rejects(optimizePostImages(directory), /이름이 겹칩니다/);
  assert.deepEqual((await readdir(directory)).sort(), ['index.md', 'photo.jpg', 'photo.png']);
});

test('손상된 이미지가 있으면 해당 글의 파일과 본문을 바꾸지 않는다', async (t) => {
  const markdown = '![정상](./a.png)\n![손상](./b.jpg)';
  const directory = await createPost(t, markdown);
  await writeFile(join(directory, 'a.png'), await image().png().toBuffer());
  await writeFile(join(directory, 'b.jpg'), 'broken');

  await assert.rejects(optimizePostImages(directory));
  assert.deepEqual((await readdir(directory)).sort(), ['a.png', 'b.jpg', 'index.md']);
  assert.equal(await readFile(join(directory, 'index.md'), 'utf8'), markdown);
});
