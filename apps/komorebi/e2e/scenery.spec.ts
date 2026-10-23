import { expect, test } from '@playwright/test';

test('every region keeps animating at rest without shader errors', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  const destinations = [
    ['village', '바람이 머무는 논'],
    ['river', '물소리 다리'],
    ['coast', '여름 끝의 바다'],
    ['forest', '숲속의 작은 소원'],
    ['school', '방학 중인 우리 학교'],
    ['shops', '골목 끝 작은 상점가'],
    ['home', '파란 지붕 우리 집'],
  ];
  for (const [region, name] of destinations) {
    await page.getByRole('button', { name: '산책 지도 열기' }).click();
    const guide =
      region === 'shops'
        ? page.locator('.discovery-guide').last()
        : page.locator('.discovery-guide, .home-guide').filter({ hasText: name! });
    await guide.click();
    await expect(page.locator('.landscape')).toHaveAttribute('data-region', region!, { timeout: 35_000 });
    if (region === 'home') {
      await expect(page.locator('.village-map')).toHaveAttribute('aria-label', /현재 좌표 36, 70/, { timeout: 15_000 });
    } else {
      await expect(page.locator('.interact', { hasText: name! })).toBeVisible({ timeout: 15_000 });
    }
    await expect(page.locator('.landscape')).toHaveAttribute('data-motion', 'idle', { timeout: 15_000 });
    await page.waitForTimeout(1100);
    const canvas = page.locator('.landscape canvas');
    const before = await canvas.screenshot({ path: `/tmp/komorebi-life-${region}.png` });
    await page.waitForTimeout(800);
    const after = await canvas.screenshot();
    expect(before.equals(after), `${region} is frozen`).toBe(false);
    expect(errors, `${region} rendering errors`).toEqual([]);
    if (process.env.SCENERY_REVIEW_DIR) {
      for (let frame = 0; frame < 5; frame++) {
        await page.waitForTimeout(2000);
        await canvas.screenshot({ path: `${process.env.SCENERY_REVIEW_DIR}/${region}-${frame}.png` });
      }
    }
  }
});
