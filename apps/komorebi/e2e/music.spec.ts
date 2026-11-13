import { expect, test } from '@playwright/test';

const API_URL = 'https://w.soundcloud.com/player/api.js';
const MUSIC_API = `
(() => {
  const Events = Object.fromEntries(['READY', 'PLAY', 'PAUSE', 'PLAY_PROGRESS', 'FINISH', 'ERROR'].map(name => [name, name]));
  function Widget() {
    const handlers = new Map();
    return {
      bind(name, handler) { handlers.set(name, handler); if (name === Events.READY) queueMicrotask(() => handler({})); },
      unbind(name) { handlers.delete(name); },
      getSounds(callback) { callback([{ id: 1, title: '산책 노래', duration: 120000 }]); },
      getCurrentSoundIndex(callback) { callback(0); },
      setVolume() {},
      play() { handlers.get(Events.PLAY)?.({}); },
      pause() { handlers.get(Events.PAUSE)?.({}); }
    };
  }
  Widget.Events = Events;
  window.SC = { Widget };
})();`;

test('retry keeps the MP3 panel open and reconnects without autoplay', async ({ page }) => {
  let shouldFail = true;
  await page.route('https://w.soundcloud.com/player/?*', (route) => route.abort());
  await page.route(API_URL, (route) =>
    shouldFail ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: MUSIC_API }),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'MP3 열기', exact: true }).click();
  await expect(page.getByRole('button', { name: '다시 불러오기' })).toBeVisible();
  shouldFail = false;
  await page.getByRole('button', { name: '다시 불러오기' }).click();
  await expect(page.locator('.music-panel')).toBeVisible();
  await expect(page.getByRole('button', { name: 'MP3 닫기' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: '재생', exact: true })).toBeEnabled();
  await expect(page.locator('.music-now strong')).toHaveText('산책 노래');
  await expect(page.locator('.music-toggle')).not.toHaveClass(/is-playing/);
  await page.getByRole('button', { name: '재생', exact: true }).click();
  await expect(page.getByRole('button', { name: '일시정지' })).toBeVisible();
  await page.getByRole('button', { name: 'MP3 닫기' }).click();
  await expect(page.locator('.music-panel')).toBeHidden();
  await expect(page.getByRole('button', { name: 'MP3 열기 · 재생 중' })).toBeVisible();
});
