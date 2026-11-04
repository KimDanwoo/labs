import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function openRide(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('.prairie-loader')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
  return errors;
}

/** Pixel diversity catches a blank WebGL/post-processing frame even when the HUD works. */
async function verifyFrame(page: Page, info: TestInfo, name: string) {
  const frame = await page.locator('canvas').screenshot();
  await info.attach(name, { body: frame, contentType: 'image/png' });
  const colors = await page.evaluate(async (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bins = new Set<string>();
    let darkest = 255,
      brightest = 0;
    for (let y = Math.floor(canvas.height * 0.3); y < canvas.height * 0.75; y += 16) {
      for (let x = Math.floor(canvas.width * 0.15); x < canvas.width * 0.85; x += 16) {
        const index = (y * canvas.width + x) * 4;
        bins.add(`${pixels[index]! >> 3},${pixels[index + 1]! >> 3},${pixels[index + 2]! >> 3}`);
        const luminance = pixels[index]! * 0.2126 + pixels[index + 1]! * 0.7152 + pixels[index + 2]! * 0.0722;
        darkest = Math.min(darkest, luminance);
        brightest = Math.max(brightest, luminance);
      }
    }
    return { count: bins.size, range: brightest - darkest };
  }, frame.toString('base64'));
  expect(colors.count, `${name} must contain a rendered landscape`).toBeGreaterThan(20);
  expect(colors.range, `${name} must contain lit surfaces and shadows`).toBeGreaterThan(40);
}

test('desktop: cinematic rendering survives camera changes, recentering and resizing', async ({ page }, info) => {
  const errors = await openRide(page);
  await expect(page.getByRole('button', { name: '가까운 주행 시점' })).toHaveAttribute('aria-pressed', 'true');
  await verifyFrame(page, info, 'desktop-close');
  await page.getByRole('button', { name: '넓은 풍경 시점' }).click();
  await expect(page.getByRole('button', { name: '넓은 풍경 시점' })).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(730, 450);
  await page.mouse.down();
  await page.mouse.move(940, 520, { steps: 12 });
  await page.mouse.up();
  await page.getByRole('button', { name: '시점 초기화' }).click();
  await page.setViewportSize({ width: 3840, height: 2160 });
  await expect
    .poll(() => page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width * canvas.height))
    .toBeLessThanOrEqual(3_205_000);
  await page.setViewportSize({ width: 1120, height: 760 });
  await verifyFrame(page, info, 'desktop-wide-resized');
  await page.getByText('조작법', { exact: false }).click();
  await expect(page.getByText('바람을 따라, 자유롭게.')).toBeVisible();
  await page.getByText('조작법', { exact: false }).click();
  await page.getByRole('button', { name: '안내를 숨기고 풍경만 보기' }).click();
  await expect(page.getByRole('button', { name: '넓은 풍경 시점' })).toHaveCount(0);
  await page.getByRole('button', { name: '화면 안내 다시 보기' }).click();
  await expect(page.getByRole('button', { name: '넓은 풍경 시점' })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('desktop: running, sprinting, takeoff and descent remain usable', async ({ page }, info) => {
  const errors = await openRide(page);
  await page.locator('canvas').focus();
  await page.keyboard.down('KeyW');
  await expect.poll(async () => Number(await page.getByLabel('현재 속도').textContent())).toBeGreaterThan(20);
  await page.keyboard.down('Shift');
  await expect.poll(async () => Number(await page.getByLabel('현재 속도').textContent())).toBeGreaterThan(48);
  await page.keyboard.down('Space');
  await expect(page.getByLabel('비행 높이')).toBeVisible();
  await expect.poll(async () => Number(await page.getByLabel('비행 높이').textContent())).toBeGreaterThan(3);
  await page.keyboard.up('Space');
  await page.keyboard.up('Shift');
  await page.keyboard.up('KeyW');
  await verifyFrame(page, info, 'flight');
  await page.keyboard.down('KeyC');
  await expect(page.getByLabel('비행 높이')).toHaveCount(0);
  await page.keyboard.up('KeyC');
  await expect.poll(async () => Number(await page.getByLabel('현재 속도').textContent())).toBe(0);
  expect(errors).toEqual([]);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  test('touch steering, camera controls and help fit without covering the action buttons', async ({ page }, info) => {
    const backgrounds: string[] = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.hdr')) backgrounds.push(new URL(request.url()).pathname);
    });
    const errors = await openRide(page);
    expect(backgrounds).toEqual(['/environments/golden-meadow-1k.hdr']);
    await expect(page.locator('canvas')).toHaveAttribute('data-render-mode', 'direct');
    await page.getByRole('button', { name: '넓은 풍경 시점' }).tap();
    await expect(page.getByRole('button', { name: '넓은 풍경 시점' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '가까운 주행 시점' }).tap();
    await page.getByText('조작법', { exact: false }).tap();
    await expect(page.getByText('화면을 끌어 달린 뒤', { exact: false })).toBeVisible();
    await page.getByText('조작법', { exact: false }).tap();
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: 100, y: 520 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: 100, y: 445 }] });
    await expect.poll(async () => Number(await page.getByLabel('현재 속도').textContent())).toBeGreaterThan(5);
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => Number(await page.getByLabel('현재 속도').textContent())).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await verifyFrame(page, info, 'phone');
    expect(errors).toEqual([]);
  });
});
