/**
 * 공유 미리보기(OG)와 아이콘을 앱의 실제 그림·글꼴로 찍는다.
 *
 *   pnpm brand-assets                 # 전부
 *   pnpm brand-assets fe-deep komorebi
 *
 * 스도쿠 OG의 보드는 운영 사이트 화면을 찍는다. 다른 주소는 SUDOKU_URL로 넘긴다.
 */

import { chromium } from '@playwright/test';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEMPLATES = join(ROOT, 'scripts/brand-assets');
const OG_SIZE = { width: 1200, height: 630 };
const APPLE_ICON_SIZE = 180;
const FAVICON_SIZES = [16, 32, 48];
const JPEG_QUALITY = 88;
const SUDOKU_URL = process.env.SUDOKU_URL ?? 'https://sudoku.danwoo.dev/';
const BOARD_SELECTOR = 'table[role="grid"]';

const APPS = {
  komorebi: { og: { template: 'komorebi-og.html', file: 'opengraph-image.jpg' } },
  'awesome-sudoku': {
    og: { template: 'awesome-sudoku-og.html', file: 'opengraph-image.png', slots: { board: captureSudokuBoard } },
    favicon: true,
  },
  'fe-deep': { og: { template: 'fe-deep-og.html', file: 'opengraph-image.png' }, favicon: true },
  prairie: {},
  soundlab: {},
};

const appDir = (app) => join(ROOT, 'apps', app, 'app');

async function captureSudokuBoard(browser) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  await page.goto(SUDOKU_URL, { waitUntil: 'networkidle' });
  const board = page.locator(BOARD_SELECTOR);
  await board.waitFor();
  const png = await board.screenshot();
  await page.close();
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function shootOg(browser, app, { template, file, slots = {} }) {
  const page = await browser.newPage({ viewport: OG_SIZE });
  await page.goto(pathToFileURL(join(TEMPLATES, template)).href);
  for (const [slot, fill] of Object.entries(slots)) {
    const src = await fill(browser);
    await page.locator(`[data-slot="${slot}"]`).evaluate((img, value) => {
      img.src = value;
      return img.decode();
    }, src);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0));
  const out = join(appDir(app), file);
  const isJpeg = file.endsWith('.jpg');
  await page.screenshot({ path: out, type: isJpeg ? 'jpeg' : 'png', quality: isJpeg ? JPEG_QUALITY : undefined });
  await page.close();
  return out;
}

async function renderSvg(browser, svg, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  await page.setContent(
    `<body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block">`,
  );
  await page.locator('img').evaluate((img) => img.decode());
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

const fullBleed = (svg) => svg.replace(/(<rect\b[^>]*?)\s+rx="[^"]*"/, '$1');

async function shootAppleIcon(browser, app, svg) {
  const out = join(appDir(app), 'apple-icon.png');
  await writeFile(out, await renderSvg(browser, fullBleed(svg), APPLE_ICON_SIZE));
  return out;
}

function toIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

async function shootFavicon(browser, app, svg) {
  const images = [];
  for (const size of FAVICON_SIZES) images.push({ size, png: await renderSvg(browser, svg, size) });
  const out = join(appDir(app), 'favicon.ico');
  await writeFile(out, toIco(images));
  return out;
}

async function buildApp(browser, app) {
  const { og, favicon } = APPS[app];
  const svg = await readFile(join(appDir(app), 'icon.svg'), 'utf8');
  const outputs = [await shootAppleIcon(browser, app, svg)];
  if (favicon) outputs.push(await shootFavicon(browser, app, svg));
  if (og) outputs.push(await shootOg(browser, app, og));
  return outputs;
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter((app) => !(app in APPS));
  if (unknown.length) throw new Error(`모르는 앱: ${unknown.join(', ')} (가능: ${Object.keys(APPS).join(', ')})`);
  const apps = requested.length ? requested : Object.keys(APPS);
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const app of apps) {
      for (const out of await buildApp(browser, app)) {
        const { size } = await stat(out);
        process.stdout.write(`${out.slice(ROOT.length)}  ${(size / 1024).toFixed(1)}KB\n`);
      }
    }
  } finally {
    await browser.close();
  }
}

await main();
