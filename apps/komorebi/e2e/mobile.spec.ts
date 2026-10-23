import { expect, test, type Page } from '@playwright/test';

const landscape = (page: Page) => page.locator('.landscape');

async function openWalk(page: Page) {
  await page.addInitScript(() => {
    const counted = window as unknown as { renders: number };
    counted.renders = 0;
    const clear = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function (mask: number) {
      counted.renders++;
      return clear.call(this, mask);
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
}

async function rendersPerSecond(page: Page, seconds = 2) {
  const read = () => page.evaluate(() => (window as unknown as { renders: number }).renders);
  const start = await read();
  await page.waitForTimeout(seconds * 1000);
  return ((await read()) - start) / seconds;
}

test('the scene renders about 30 fps at rest, up to 60 fps while moving, and rests under a dialog', async ({
  page,
}) => {
  await openWalk(page);
  await page.waitForTimeout(1500);
  const idle = await rendersPerSecond(page);
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowUp');
  const moving = await rendersPerSecond(page, 1);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(1500);
  const paused = await rendersPerSecond(page);
  test.info().annotations.push({ type: 'renders/s', description: `idle ${idle}, moving ${moving}, paused ${paused}` });
  expect(idle).toBeGreaterThan(20);
  expect(idle).toBeLessThan(36);
  expect(moving).toBeGreaterThan(idle);
  expect(moving).toBeLessThan(66);
  expect(paused).toBeLessThan(36);
});

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('dragging the pad walks, and a dialog releases the pad', async ({ page }) => {
    await openWalk(page);
    const pad = await page.locator('.joystick').boundingBox();
    if (!pad) throw new Error('joystick not visible');
    const centre = { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
    const cdp = await page.context().newCDPSession(page);
    type TouchType = 'touchStart' | 'touchMove' | 'touchEnd';
    const touch = (type: TouchType, points: { x: number; y: number; id: number }[]) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    await touch('touchStart', [{ ...centre, id: 1 }]);
    await touch('touchMove', [{ x: centre.x, y: centre.y - pad.height / 2, id: 1 }]);
    await expect(landscape(page)).toHaveAttribute('data-motion', 'running');
    // A second finger's tap is not turned into a click by the browser, so open the map with its shortcut.
    await page.keyboard.press('KeyM');
    await expect(page.getByRole('dialog', { name: '여름을 걷는 지도' })).toBeVisible();
    await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
    await expect(page.locator('.joystick-thumb')).toHaveAttribute('style', /translate\(0px, 0px\)/);
    await touch('touchEnd', []);
    await page.getByRole('button', { name: '지도 닫기' }).click();
    await page.waitForTimeout(500);
    await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
  });
});

test('screen readers hear the region name after a crossing', async ({ page }) => {
  await openWalk(page);
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveText('파란 지붕 아래 논길');
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page
    .getByRole('dialog', { name: '여름을 걷는 지도' })
    .getByRole('button', { name: /물소리 다리/ })
    .first()
    .click();
  await expect(live).toHaveText('졸졸, 물소리 다리', { timeout: 15_000 });
});
