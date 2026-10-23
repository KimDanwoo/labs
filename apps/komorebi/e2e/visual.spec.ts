import { test, type Page } from '@playwright/test';

const DIR = process.env.SHOT_DIR ?? '';
test.skip(!DIR, 'visual capture only runs with SHOT_DIR');
test.use({ reducedMotion: 'reduce' });

async function open(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('komorebi-discoveries-v1', JSON.stringify(['fields', 'river']));
    localStorage.setItem('komorebi-evening-discoveries-v1', JSON.stringify(['fields']));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.loading').waitFor({ state: 'detached', timeout: 20_000 });
  await page.waitForTimeout(800);
}

test('desktop states', async ({ page }) => {
  await open(page);
  await page.screenshot({ path: `${DIR}/start.png` });
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/map.png` });
  await page.getByRole('button', { name: '바람이 머무는 논 추억 다시 읽기' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/memory.png` });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '노을로 바꾸기' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/evening.png` });
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('phone states', async ({ page }) => {
    await open(page);
    await page.screenshot({ path: `${DIR}/phone.png` });
    await page.getByRole('button', { name: '산책 지도 열기' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${DIR}/phone-map.png` });
  });
});
