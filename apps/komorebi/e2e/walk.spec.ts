import { expect, test, type Page } from '@playwright/test';

const landscape = (page: Page) => page.locator('.landscape');

async function openWalk(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
}

test('the walk loads and walks with the keyboard', async ({ page }) => {
  await openWalk(page);
  await page.locator('.landscape canvas').focus();
  const before = await page.locator('.village-map').getAttribute('aria-label');
  await page.keyboard.down('ArrowRight');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'running');
  await expect.poll(() => page.locator('.village-map').getAttribute('aria-label')).not.toBe(before);
  await page.keyboard.up('ArrowRight');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
});

test('Space on a focused button presses the button instead of jumping', async ({ page }) => {
  await openWalk(page);
  const mapButton = page.getByRole('button', { name: '산책 지도 열기' });
  await mapButton.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog', { name: '여름을 걷는 지도' })).toBeVisible();
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

async function guideTo(page: Page, landmark: string) {
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page
    .getByRole('dialog', { name: '여름을 걷는 지도' })
    .locator('.discovery-guide, .home-guide')
    .filter({ hasText: landmark })
    .click();
}

async function walkToBed(page: Page) {
  await guideTo(page, '파란 지붕 우리 집');
  await expect(landscape(page)).toHaveAttribute('data-region', 'home', { timeout: 25_000 });
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle', { timeout: 10_000 });
  await page.locator('.landscape canvas').focus();
  const coordinate = async (axis: number) => {
    const label = await page.locator('.village-map').getAttribute('aria-label');
    return Number(label!.match(/현재 좌표 (\d+), (\d+)/)![axis]);
  };
  await page.keyboard.down('ArrowDown');
  await expect.poll(() => coordinate(2), { intervals: [50] }).toBeGreaterThanOrEqual(78);
  await page.keyboard.up('ArrowDown');
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => coordinate(1), { intervals: [50], timeout: 10_000 }).toBeGreaterThanOrEqual(68);
  await page.keyboard.up('ArrowRight');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
  await expect(page.locator('.interact', { hasText: '포근한 잠자리' })).toBeVisible();
}

async function sleepAtHome(page: Page, count = 1) {
  await walkToBed(page);
  for (let i = 0; i < count; i++) {
    await page.locator('.interact', { hasText: '포근한 잠자리' }).click();
    await expect(page.locator('.sleep-transition')).toBeVisible();
    await expect(page.locator('.sleep-transition')).toHaveCount(0, { timeout: 5_000 });
  }
}

test('an open dialog pauses a guided walk, which resumes when it closes', async ({ page }) => {
  await openWalk(page);
  await guideTo(page, '물소리 다리');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'running');
  await page.keyboard.press('KeyM');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
  await page.keyboard.press('Escape');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'running');
});

test('the first view does not wait for the other paintings', async ({ page }) => {
  await page.route(/\/art\/(?!village|child)/, () => {});
  await openWalk(page);
  await expect(landscape(page)).toHaveAttribute('data-region', 'village');
});

test('a slow neighbouring painting holds the child at the exit, then crosses', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/art/river-game.webp', async (route) => {
    await held;
    await route.continue();
  });
  await openWalk(page);
  await guideTo(page, '물소리 다리');
  await expect(page.getByRole('status')).toContainText('풍경을 펼치고 있어요', { timeout: 15_000 });
  await expect(landscape(page)).toHaveAttribute('data-region', 'village');
  release();
  await expect(landscape(page)).toHaveAttribute('data-region', 'river', { timeout: 15_000 });
});

test('a failed neighbouring painting keeps the child in the current region', async ({ page }) => {
  await page.route('**/art/river-game.webp', (route) => route.abort());
  await openWalk(page);
  await guideTo(page, '물소리 다리');
  await expect(page.getByRole('status')).toContainText('불러오지 못했어요', { timeout: 15_000 });
  await expect(landscape(page)).toHaveAttribute('data-region', 'village');
});

test('choosing a new destination while an exit is loading cancels that crossing', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/art/river-game.webp', async (route) => {
    await held;
    await route.continue();
  });
  await openWalk(page);
  await guideTo(page, '물소리 다리');
  await expect(page.getByRole('status')).toContainText('풍경을 펼치고 있어요', { timeout: 15_000 });
  await guideTo(page, '바람이 머무는 논');
  release();
  await expect(page.locator('.interact')).toContainText('바람이 머무는 논', { timeout: 15_000 });
  await expect(landscape(page)).toHaveAttribute('data-region', 'village');
});

test('a place found at dusk keeps a dusk page that the diary can reread', async ({ page }) => {
  test.setTimeout(120_000);
  await openWalk(page);
  await sleepAtHome(page);
  await guideTo(page, '바람이 머무는 논');
  await expect(page.locator('.interact')).toContainText('노을빛으로 머물러 보기', { timeout: 15_000 });
  await page.locator('.interact').click();
  const memory = page.getByRole('dialog', { name: '바람이 머무는 논' });
  await expect(memory).toContainText('노을이 논물 위에 길게 눕는다');
  await memory.getByRole('button', { name: '추억 닫기' }).click();
  await sleepAtHome(page, 2);
  await guideTo(page, '바람이 머무는 논');
  await expect(page.locator('.interact')).toContainText('잠깐 머물러 보기', { timeout: 20_000 });
  await page.locator('.interact').click();
  await expect(memory).toContainText('초록빛 파도가 발끝까지 밀려온다');
  await memory.getByRole('button', { name: '추억 닫기' }).click();
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.getByRole('button', { name: '바람이 머무는 논 추억 다시 읽기' }).click();
  await expect(memory).toContainText('초록빛 파도가 발끝까지 밀려온다');
  await expect(memory).toContainText('노을이 논물 위에 길게 눕는다');
  await expect(memory).toContainText('여름의 조각 2 / 18');
  await expect(page.locator('.journal-button b')).toHaveText('1 / 6');
});

test('choosing the cancelled exit again resumes the crossing once it loads', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/art/river-game.webp', async (route) => {
    await held;
    await route.continue();
  });
  await openWalk(page);
  await guideTo(page, '물소리 다리');
  await expect(page.getByRole('status')).toContainText('풍경을 펼치고 있어요', { timeout: 15_000 });
  await guideTo(page, '바람이 머무는 논');
  await guideTo(page, '물소리 다리');
  release();
  await expect(landscape(page)).toHaveAttribute('data-region', 'river', { timeout: 15_000 });
});

test('footfalls follow the ground: dirt in the village, wood on the river bridge', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await openWalk(page);
  await page.getByRole('button', { name: '자연 소리 켜기' }).click();
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowUp');
  await expect(landscape(page)).toHaveAttribute('data-surface', 'dirt');
  await page.keyboard.up('ArrowUp');
  await guideTo(page, '물소리 다리');
  await expect(landscape(page)).toHaveAttribute('data-region', 'river', { timeout: 15_000 });
  await expect(landscape(page)).toHaveAttribute('data-surface', 'wood', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('sleeping at home advances the day and a night visit keeps a night page', async ({ page }) => {
  test.setTimeout(120_000);
  await openWalk(page);
  await sleepAtHome(page, 2);
  await expect(page.locator('main.walk')).toHaveClass(/is-night/);
  await guideTo(page, '바람이 머무는 논');
  await expect(page.locator('.interact')).toContainText('밤의 풍경 바라보기', { timeout: 15_000 });
  await page.locator('.interact').click();
  const memory = page.getByRole('dialog', { name: '바람이 머무는 논' });
  await expect(memory).toContainText('논물에 별이 하나씩 내려앉는다');
  await expect(memory).toContainText('여름의 조각 1 / 18');
  await memory.getByRole('button', { name: '추억 닫기' }).click();
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.getByRole('button', { name: '바람이 머무는 논 추억 다시 읽기' }).click();
  await expect(memory).toContainText('논물에 별이 하나씩 내려앉는다');
  await expect(memory).not.toContainText('초록빛 파도가 발끝까지 밀려온다');
  await page.keyboard.press('Escape');
  await sleepAtHome(page);
  await expect(page.locator('main.walk')).toHaveClass(/is-day/);
});

test('players from before the day pages keep every page they could read', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('komorebi-discoveries-v1', JSON.stringify(['fields', 'river']));
    localStorage.setItem('komorebi-evening-discoveries-v1', JSON.stringify(['fields']));
  });
  await openWalk(page);
  await expect(page.locator('.journal-button b')).toHaveText('2 / 6');
  await page.getByRole('button', { name: '산책 지도 열기' }).click();
  await page.getByRole('button', { name: '바람이 머무는 논 추억 다시 읽기' }).click();
  const memory = page.getByRole('dialog', { name: '바람이 머무는 논' });
  await expect(memory).toContainText('초록빛 파도가 발끝까지 밀려온다');
  await expect(memory).toContainText('노을이 논물 위에 길게 눕는다');
  await expect(memory).toContainText('여름의 조각 3 / 18');
});

test('once a page is kept, the place offers its little action instead', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await openWalk(page);
  await page.getByRole('button', { name: '자연 소리 켜기' }).click();
  await guideTo(page, '물소리 다리');
  // The guided route passes the rice field first, so wait for the bridge's own prompt.
  const prompt = page.locator('.interact', { hasText: '물소리 다리' });
  await expect(prompt).toContainText('잠깐 머물러 보기', { timeout: 30_000 });
  await prompt.click();
  await page.getByRole('dialog', { name: '물소리 다리' }).getByRole('button', { name: '추억 닫기' }).click();
  await expect(prompt).toContainText('물수제비 뜨기');
  await prompt.click();
  await expect(page.getByRole('status')).toContainText('돌이 세 번 튀었다');
  await expect(page.getByRole('dialog', { name: '물소리 다리' })).toBeHidden();
  await expect(page.locator('.journal-button b')).toHaveText('1 / 6');
  expect(errors).toEqual([]);
});

test('showers arrive randomly and pass without weather controls', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.clock.install();
  await openWalk(page);
  await expect(page.getByRole('button', { name: '소나기 내리게 하기' })).toHaveCount(0);
  await page.clock.fastForward(111_000);
  await expect(page.locator('main.walk')).toHaveClass(/is-raining/);
  await page.clock.fastForward(91_000);
  await expect(page.locator('main.walk')).not.toHaveClass(/is-raining/);
});

test('a cat or a dog strolls through now and then, but stays home in the rain', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.clock.install();
  await openWalk(page);
  await expect(landscape(page)).toHaveAttribute('data-visitor', /^(cat|dog)$/, { timeout: 30_000 });
  await page.clock.fastForward(111_000);
  await expect(page.locator('main.walk')).toHaveClass(/is-raining/);
  await expect(landscape(page)).toHaveAttribute('data-visitor', '', { timeout: 5_000 });
});

test('home is a walkable map with a bed and a doorway back to the village', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openWalk(page);
  await walkToBed(page);
  await expect(page.locator('.landscape canvas')).toHaveCount(1);
  await expect(page.locator('.home-dialog')).toHaveCount(0);
  await expect(landscape(page)).toHaveAttribute('data-surface', 'wood');
  await page.screenshot({ path: '/tmp/komorebi-home-day.png' });
  for (const phase of ['evening', 'night', 'day']) {
    await page.locator('.interact', { hasText: '포근한 잠자리' }).click();
    await expect(page.locator('main.walk')).toHaveClass(new RegExp(`is-${phase}`));
    await expect(page.locator('.sleep-transition')).toHaveCount(0);
  }
  await expect(page.locator('.game-header')).toContainText('2일째');
  // The same small character can walk right up to the resized desk and chair.
  const coordinate = async (axis: number) => {
    const label = await page.locator('.village-map').getAttribute('aria-label');
    return Number(label!.match(/현재 좌표 (\d+), (\d+)/)![axis]);
  };
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => coordinate(1), { intervals: [50] }).toBeLessThanOrEqual(40);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => coordinate(2), { intervals: [50] }).toBeLessThanOrEqual(58);
  await page.keyboard.up('ArrowUp');
  await expect(landscape(page)).toHaveAttribute('data-motion', 'idle');
  await page.screenshot({ path: '/tmp/komorebi-home-desk.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/komorebi-home-mobile.png' });
  await guideTo(page, '바람이 머무는 논');
  await expect(landscape(page)).toHaveAttribute('data-region', 'village', { timeout: 20_000 });
  expect(errors).toEqual([]);
});

test('footsteps play recorded takes for the ground underfoot, never the same take twice running', async ({ page }) => {
  await page.addInitScript(() => {
    const played: string[] = [];
    Object.assign(window, { played });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration < 1.5) played.push(this.buffer.duration.toFixed(4));
      return start.apply(this, args);
    };
  });
  const fetched: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/sounds/steps/') && response.ok()) fetched.push(response.url());
  });
  await openWalk(page);
  await page.getByRole('button', { name: '자연 소리 켜기' }).click();
  await expect.poll(() => fetched.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(20);
  await page.locator('.landscape canvas').focus();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowUp');
  const played = await page.evaluate(() => (window as unknown as { played: string[] }).played);
  expect(played.length).toBeGreaterThanOrEqual(3);
  played.slice(1).forEach((take, i) => expect(take).not.toBe(played[i]));
});
