import { expect, test, type Page } from '@playwright/test';

async function guideTo(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.locator('.discovery-guide').filter({ hasText: name }).click();
}

async function openBoard(page: Page): Promise<void> {
  await expect(page.locator('.landscape')).toHaveAttribute('data-motion', 'idle');
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowLeft');
  try {
    await expect(page.locator('.interact')).toContainText('칠판에 낙서하기');
  } finally {
    await page.keyboard.up('ArrowLeft');
  }
  await page.keyboard.press('KeyE');
  await expect(page.getByRole('dialog', { name: '칠판에 낙서하기' })).toBeVisible();
}

test('school friends walk and pause, and classroom chalk survives leaving and reloading', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://w.soundcloud.com/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  const landscape = page.locator('.landscape');
  await expect(landscape).toHaveAttribute('data-schoolmates', '0');
  await guideTo(page, '방학 중인 우리 학교');
  await expect(landscape).toHaveAttribute('data-region', 'school', { timeout: 30_000 });
  await expect(landscape).toHaveAttribute('data-schoolmates', '2');
  await expect(landscape).toHaveAttribute('data-schoolmate-positions', /^\S+ \S+$/);
  const before = await landscape.getAttribute('data-schoolmate-positions');
  await expect.poll(() => landscape.getAttribute('data-schoolmate-positions')).not.toBe(before);

  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await expect(landscape).toHaveAttribute('data-motion', 'idle');
  // Positions are sampled less often than the animation; let the paused sample reach the DOM.
  await page.waitForTimeout(200);
  const paused = await landscape.getAttribute('data-schoolmate-positions');
  await page.waitForTimeout(500);
  await expect(landscape).toHaveAttribute('data-schoolmate-positions', paused ?? '');
  await page.locator('.discovery-guide').filter({ hasText: '여름방학의 우리 교실' }).click();
  await expect(landscape).toHaveAttribute('data-region', 'hallway', { timeout: 15_000 });
  await expect(landscape).toHaveAttribute('data-schoolmates', '2');
  await expect(landscape).toHaveAttribute('data-region', 'classroom', { timeout: 15_000 });
  await expect(landscape).toHaveAttribute('data-schoolmates', '2');
  await openBoard(page);
  await page.getByRole('button', { name: '분홍 분필' }).click();
  const pad = page.locator('.chalk-pad');
  const rect = await pad.boundingBox();
  expect(rect).not.toBeNull();
  if (!rect) return;
  await page.mouse.move(rect.x + rect.width * 0.3, rect.y + rect.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 0.7, rect.y + rect.height * 0.5, { steps: 12 });
  await page.mouse.up();
  const saved = await page.evaluate(() => localStorage.getItem('komorebi-chalkboard-v1'));
  expect(saved).toContain('"color":"pink"');
  const drawing = await pad.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.getByRole('button', { name: '칠판 닫기' }).click();
  await expect(page.locator('.landscape canvas')).toBeFocused();
  await page.reload();
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  expect(await page.evaluate(() => localStorage.getItem('komorebi-chalkboard-v1'))).toBe(saved);
  await guideTo(page, '여름방학의 우리 교실');
  await expect(landscape).toHaveAttribute('data-region', 'classroom', { timeout: 40_000 });
  await openBoard(page);
  await expect.poll(() => pad.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(drawing);
  await page.getByRole('button', { name: '되돌리기' }).click();
  await expect(page.getByRole('button', { name: '되돌리기' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('reduced motion keeps school friends standing in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://w.soundcloud.com/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await guideTo(page, '방학 중인 우리 학교');
  const landscape = page.locator('.landscape');
  await expect(landscape).toHaveAttribute('data-schoolmates', '2', { timeout: 30_000 });
  await expect(landscape).toHaveAttribute('data-schoolmate-positions', /^\S+ \S+$/);
  const before = await landscape.getAttribute('data-schoolmate-positions');
  await page.waitForTimeout(500);
  await expect(landscape).toHaveAttribute('data-schoolmate-positions', before ?? '');
});

for (const screen of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`greet a friend, miss and retry a ball, complete five passes and return to walking — ${screen.name}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('https://w.soundcloud.com/**', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
    await page.getByRole('button', { name: '산책 옷 고르기' }).click();
    await page.getByRole('button', { name: /바람빛 체육복/ }).click();
    await expect(page.locator('.landscape')).toHaveAttribute('data-appearance', 'straw-hat-pe');
    await page.getByRole('button', { name: '옷장 닫기' }).click();
    await page.reload();
    await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator('.landscape')).toHaveAttribute('data-appearance', 'straw-hat-pe');
    await guideTo(page, '방학 중인 우리 학교');
    const landscape = page.locator('.landscape');
    await expect(landscape).toHaveAttribute('data-region', 'school', { timeout: 30_000 });
    await expect(landscape).toHaveAttribute('data-motion', 'idle');
    const canvas = page.locator('.landscape canvas');
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;
    await canvas.click({ position: { x: bounds.width * 0.16, y: bounds.height * 0.75 } });
    await expect(page.locator('.interact')).toContainText('친구에게 인사하기', { timeout: 15_000 });
    await page.keyboard.press('KeyE');
    const greeting = page.getByRole('dialog', { name: '하루의 인사' });
    await expect(greeting).toBeVisible();
    await page.keyboard.press('KeyE');
    await expect(greeting).toHaveCount(0);
    await expect(canvas).toBeFocused();
    await page.keyboard.press('KeyE');
    await expect(greeting).toBeVisible();
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.getByRole('button', { name: '공 주고받기', exact: true }).click();
    const game = page.getByRole('dialog', { name: '하루와 공 주고받기' });
    await expect(game).toBeVisible();
    await page.keyboard.press('KeyE');
    await expect(game).toHaveAttribute('data-rallies', '0');
    await expect(game).toHaveAttribute('data-phase', 'missed');
    await page.getByRole('button', { name: '다시 놀기' }).click();
    for (let rally = 1; rally <= 5; rally++) {
      await expect(game).toHaveAttribute('data-can-catch', 'true');
      expect(Number(await landscape.getAttribute('data-ball-distance'))).toBeGreaterThanOrEqual(12);
      if (rally % 2) await page.keyboard.press('KeyE');
      else await page.getByRole('button', { name: '받아 돌려주기' }).click();
      await expect(game).toHaveAttribute('data-phase', 'caught');
      await expect(game).toHaveAttribute('data-rallies', String(rally));
    }
    await expect(game).toHaveAttribute('data-phase', 'complete');
    await expect(game).toContainText('다섯 번이나');
    await page.keyboard.press('Escape');
    await expect(game).toHaveCount(0);
    await expect(canvas).toBeFocused();
    await page.keyboard.down('ArrowDown');
    try {
      await expect(landscape).toHaveAttribute('data-motion', 'running');
    } finally {
      await page.keyboard.up('ArrowDown');
    }
    expect(errors).toEqual([]);
  });
}
