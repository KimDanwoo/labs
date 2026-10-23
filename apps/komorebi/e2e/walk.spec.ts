import { expect, test, type Page } from '@playwright/test';

const landscape = (page: Page) => page.locator('.landscape');

async function openWalk(page: Page) {
  await page.goto('/');
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
}

test('the walk loads and walks with the keyboard', async ({ page }) => {
  await openWalk(page);
  await page.locator('.landscape canvas').focus();
  const before = await page.locator('.village-map').getAttribute('aria-label');
  await page.keyboard.down('ArrowRight');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'running');
  await page.keyboard.up('ArrowRight');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
  expect(await page.locator('.village-map').getAttribute('aria-label')).not.toBe(before);
});

test('Space on a focused button presses the button instead of jumping', async ({ page }) => {
  await openWalk(page);
  const evening = page.getByRole('button', { name: '노을로 바꾸기' });
  await evening.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '한낮으로 바꾸기' })).toHaveAttribute('aria-pressed', 'true');
  await expect(landscape(page)).not.toHaveAttribute('data-motion', 'jumping');
});

test('the map opens with M, closes with Escape and returns focus to the walk', async ({ page }) => {
  await openWalk(page);
  await page.locator('.landscape canvas').focus();
  await page.keyboard.press('KeyM');
  const map = page.getByRole('dialog', { name: '여름을 걷는 지도' });
  await expect(map).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(map).toBeHidden();
  await expect(page.locator('.landscape canvas')).toBeFocused();
  await page.keyboard.press('KeyM');
  await expect(map).toBeVisible();
});

test('corrupt or duplicated saved discoveries are cleaned on load', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('komorebi-discoveries-v1', JSON.stringify(['fields', 'fields', 'nowhere', 7]));
  });
  await openWalk(page);
  await expect(page.locator('.journal-button b')).toHaveText('1 / 6');
});
