import { chromium } from '@playwright/test';

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  GAME_LIST,
  SITE_HEADLINE,
  SITE_NAME,
  SITE_URL,
} from '../apps/awesome-sudoku/src/entities/game-catalog/config/games.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEMPLATES = join(ROOT, 'scripts/brand-assets');
const OG_SIZE = { width: 1200, height: 630 };
const APPLE_ICON_SIZE = 180;
const FAVICON_SIZES = [16, 32, 48];
const JPEG_QUALITY = 88;

const APPS = {
  komorebi: { og: { template: 'komorebi-og.html', file: 'opengraph-image.jpg' }, favicon: true },
  'awesome-sudoku': { library: true, favicon: true },
  'fe-deep': { og: { template: 'fe-deep-og.html', file: 'opengraph-image.png' }, favicon: true },
  prairie: {},
  soundlab: {},
};

const appDir = (app) => join(ROOT, 'apps', app, 'app');

const PREVIEW_FOLDER = 'game-previews';
const GAME_PREVIEW_URL = process.env.GAME_PREVIEW_URL ?? SITE_URL;
const GAME_BOARD = {
  sudoku: 'table[role="grid"]',
  killer: 'table[role="grid"]',
  gomoku: '[aria-label="오목판"]',
  slitherlink: 'svg[aria-label^="슬리더링크 판"]',
  walls: '[aria-label="담쌓기 판"]',
  guess: 'main form',
};

async function captureGame(page, id, href) {
  const response = await page.goto(new URL(href, GAME_PREVIEW_URL).href);
  if (!response?.ok()) throw new Error(`플레이 화면에 접속할 수 없습니다: ${href} (${response?.status()})`);

  const board = page.locator(GAME_BOARD[id]);
  if (id === 'slitherlink') await board.locator('text').first().waitFor({ state: 'visible' });
  if (id === 'gomoku') {
    const center = await board.evaluate((element) => Math.floor(element.children.length / 2));
    await board.getByRole('button').nth(center).click();
    await page.mouse.move(0, 0);
  }
  if (id === 'guess') {
    const form = await board.boundingBox();
    const main = await page.locator('main').boundingBox();
    const hasCaptureArea = form && main;
    if (!hasCaptureArea) throw new Error('맞춰봐 플레이 화면을 찾을 수 없습니다.');
    const height = Math.ceil(form.y + form.height - main.y);
    return page.screenshot({ clip: { ...main, height } });
  }
  return board.screenshot({ animations: 'disabled' });
}

async function shootGameCards(browser, app) {
  const page = await browser.newPage({ viewport: OG_SIZE });
  const preview = await browser.newPage({ viewport: { width: 1280, height: 1000 }, colorScheme: 'light' });
  await page.goto(pathToFileURL(join(TEMPLATES, 'awesome-sudoku-og.html')).href);

  const home = {
    title: SITE_HEADLINE.replace(', ', ',\n'),
    subtitle: '설치 없이 바로 즐기는 퍼즐과 보드게임',
    file: 'opengraph-image.png',
  };
  const cards = GAME_LIST.map(([id, game]) => ({
    id,
    href: game.href,
    title: game.name,
    subtitle: game.category,
    file: join(id, 'opengraph-image.png'),
  }));
  const outputs = [];
  const previewFolder = join(appDir(app), '..', 'public', PREVIEW_FOLDER);
  await mkdir(previewFolder, { recursive: true });

  try {
    for (const { id, href, title, subtitle, file } of [home, ...cards]) {
      const png = id ? await captureGame(preview, id, href) : null;
      if (png) {
        const previewPath = join(previewFolder, `${id}.png`);
        await writeFile(previewPath, png);
        outputs.push(previewPath);
      }
      const src = png ? `data:image/png;base64,${png.toString('base64')}` : '';
      await page.evaluate(
        async ({ brand, title, subtitle, src }) => {
          document.querySelector('[data-brand]').textContent = brand;
          document.querySelector('[data-title]').textContent = title;
          document.querySelector('[data-subtitle]').textContent = subtitle;
          const artwork = document.querySelector('[data-artwork]');
          artwork.hidden = !src;
          if (src) {
            artwork.src = src;
            await artwork.decode();
          }
          await document.fonts.ready;
        },
        { brand: SITE_NAME, title, subtitle, src },
      );
      const out = join(appDir(app), file);
      await page.screenshot({ path: out });
      outputs.push(out);
    }
  } finally {
    await Promise.all([page.close(), preview.close()]);
  }

  return outputs;
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
  const { og, favicon, library } = APPS[app];
  const svg = await readFile(join(appDir(app), 'icon.svg'), 'utf8');
  const outputs = [await shootAppleIcon(browser, app, svg)];
  if (favicon) outputs.push(await shootFavicon(browser, app, svg));
  if (og) outputs.push(await shootOg(browser, app, og));
  if (library) outputs.push(...(await shootGameCards(browser, app)));
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
