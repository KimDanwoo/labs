import { expect, test } from '@playwright/test';

test('walk to the pier, fish in the world, save a catch and return to walking', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.getByRole('button', { name: /바다 낚시 부두.*창고 옆/ }).click();
  await page.getByRole('button', { name: /부두 끝에서 낚싯줄 던지기/ }).click({ timeout: 45_000 });
  const hud = page.getByRole('region', { name: '부두 낚시' });
  await expect(hud).toBeVisible();
  await expect(page.getByRole('dialog', { name: '바닷가 낚시' })).toHaveCount(0);
  await expect(page.locator('.landscape')).toHaveAttribute('data-fishing', 'casting');
  await expect(hud.getByRole('button', { name: /낚싯줄 걷기/ })).toBeVisible();
  await page.clock.install();
  await page.clock.fastForward(6100);
  await hud.getByRole('button', { name: /챔질하기!/ }).click();
  await expect(hud.getByRole('button', { name: '꾹 눌러 릴 감기' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'))).toBeNull();
  for (let i = 0; i < 350 && (await hud.locator('meter').count()); i++) {
    const tension = await hud.locator('meter').evaluate((element: HTMLMeterElement) => element.value);
    if (tension < 60) await page.keyboard.down('e');
    else await page.keyboard.up('e');
    await page.clock.runFor(100);
  }
  await page.keyboard.up('e');
  await expect(hud.getByRole('status')).toContainText('처음 만난 물고기!');
  await expect(page.locator('.landscape')).toHaveAttribute('data-fishing', 'caught');
  await expect(hud.getByRole('button', { name: /잡았다!/ })).toBeDisabled();
  await page.clock.runFor(2500);
  await expect(hud.getByRole('button', { name: /다시 던지기/ })).toBeEnabled();
  const saved = await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'));
  expect(saved).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(hud).toHaveCount(0);
  await expect(page.locator('.landscape')).toHaveAttribute('data-fishing', 'none');
  await expect(page.locator('.landscape canvas')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /부두 끝에서 낚싯줄 던지기/ }).click();
  await page.clock.runFor(850);
  const bounds = await hud.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  await expect(hud.getByText('바다 도감 · 1 / 16')).toBeVisible();
  await hud.getByRole('button', { name: /낚싯줄 걷기/ }).click();
  await expect(hud.getByRole('status')).toContainText('물고기가 달아났어요');
  expect(await page.evaluate(() => localStorage.getItem('komorebi-fish-v1'))).toBe(saved);
  await hud.getByRole('button', { name: '낚시 그만하기' }).click();
  await expect(page.locator('.landscape canvas')).toBeFocused();
});
