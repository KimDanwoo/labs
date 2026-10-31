import { expect, test } from '@playwright/test';

test('coastal fishing catches once, saves the journal and closes cleanly', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.locator('.discovery-guide').filter({ hasText: '여름 끝의 바다' }).click();
  await page.getByRole('button', { name: '🎣 바다 낚시' }).click({ timeout: 45_000 });
  const dialog = page.getByRole('dialog', { name: '바닷가 낚시' });
  await expect(dialog).toBeVisible();
  await page.clock.install();
  await dialog.getByRole('button', { name: '낚싯줄 던지기' }).click();
  await page.clock.fastForward(6100);
  await expect(dialog.getByRole('button', { name: '챔질하기!' })).toBeVisible();
  await dialog.getByRole('button', { name: '챔질하기!' }).click();
  await expect(dialog.getByRole('button', { name: '꾹 눌러 릴 감기' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'))).toBeNull();
  for (let i = 0; i < 350 && (await dialog.locator('meter').count()); i++) {
    const tension = await dialog.locator('meter').evaluate((element: HTMLMeterElement) => element.value);
    if (tension < 60) await page.keyboard.down('e');
    else await page.keyboard.up('e');
    await page.clock.runFor(100);
  }
  await page.keyboard.up('e');
  await expect(dialog.getByRole('status')).toContainText('처음 만난 물고기!');
  const saved = await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'));
  expect(saved).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '🎣 바다 낚시' }).click();
  await expect(page.getByRole('heading', { name: '바다 도감 · 1 / 4' })).toBeVisible();
  const bounds = await page.getByRole('dialog', { name: '바닷가 낚시' }).boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '낚싯줄 던지기' }).click();
  await page.getByRole('button', { name: '낚싯줄 걷기' }).click();
  await expect(page.getByRole('status').filter({ hasText: '물고기가 달아났어요' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'))).toBe(saved);
  await page.getByRole('button', { name: '낚시 닫기' }).click();
  await expect(page.locator('.landscape canvas')).toBeFocused();
});
