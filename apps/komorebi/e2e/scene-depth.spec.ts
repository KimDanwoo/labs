import { expect, test, type Page } from '@playwright/test';

async function guideTo(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.locator('.discovery-guide').filter({ hasText: name }).click();
}
async function position(page: Page): Promise<{ x: number; z: number }> {
  const raw = await page.locator('.landscape').getAttribute('data-position');
  const [x, z] = (raw ?? '').split(',').map(Number);
  if (x === undefined || z === undefined || !Number.isFinite(x) || !Number.isFinite(z))
    throw new Error('Position unavailable');
  return { x, z };
}
async function walkUntil(
  page: Page,
  key: string,
  hasArrived: (point: { x: number; z: number }) => boolean,
): Promise<void> {
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down(key);
  try {
    await expect.poll(async () => hasArrived(await position(page)), { timeout: 15_000, intervals: [32] }).toBe(true);
  } finally {
    await page.keyboard.up(key);
  }
}

test('holding and repeating Up crosses a school door once until the direction is released', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://w.soundcloud.com/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await guideTo(page, '방학 중인 우리 학교');
  const landscape = page.locator('.landscape');
  await expect(landscape).toHaveAttribute('data-region', 'school', { timeout: 30_000 });
  await expect(landscape).toHaveAttribute('data-motion', 'idle');
  await walkUntil(page, 'ArrowRight', ({ x }) => x >= 51.5);
  await page.keyboard.down('ArrowUp');
  try {
    await expect(landscape).toHaveAttribute('data-region', 'hallway');
    for (let repeat = 0; repeat < 8; repeat++) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(150);
      await expect(landscape).toHaveAttribute('data-region', 'hallway');
    }
    await expect(landscape).toHaveAttribute('data-motion', 'idle');
  } finally {
    await page.keyboard.up('ArrowUp');
  }
  await page.keyboard.down('ArrowUp');
  try {
    await expect(landscape).toHaveAttribute('data-region', 'school');
    await page.waitForTimeout(1200);
    await expect(landscape).toHaveAttribute('data-region', 'school');
    await expect(landscape).toHaveAttribute('data-motion', 'idle');
  } finally {
    await page.keyboard.up('ArrowUp');
  }
});

test('walking across the floor below both desk groups keeps the child in front of every desk', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://w.soundcloud.com/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await guideTo(page, '여름방학의 우리 교실');
  const landscape = page.locator('.landscape');
  await expect(landscape).toHaveAttribute('data-region', 'classroom', { timeout: 40_000 });
  await expect(landscape).toHaveAttribute('data-motion', 'idle');
  await walkUntil(page, 'ArrowLeft', ({ x }) => x <= 50);
  await walkUntil(page, 'ArrowDown', ({ z }) => z >= 94);
  await walkUntil(page, 'ArrowLeft', ({ x }) => x <= 12);
  await expect(landscape).toHaveAttribute('data-player-occluders', '0');
  const leftPhoto = page.waitForEvent('download');
  await page.getByRole('button', { name: '풍경 사진 저장' }).click();
  await (await leftPhoto).saveAs(testInfo.outputPath('classroom-front-left.png'));
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowRight');
  try {
    for (let sample = 0; sample < 20; sample++) {
      await page.waitForTimeout(150);
      await expect(landscape).toHaveAttribute('data-player-occluders', '0');
    }
  } finally {
    await page.keyboard.up('ArrowRight');
  }
  await walkUntil(page, 'ArrowRight', ({ x }) => x >= 88);
  await expect(landscape).toHaveAttribute('data-player-occluders', '0');
  const rightPhoto = page.waitForEvent('download');
  await page.getByRole('button', { name: '풍경 사진 저장' }).click();
  await (await rightPhoto).saveAs(testInfo.outputPath('classroom-front-right.png'));
});
