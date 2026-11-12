import { MESSAGE, parseServerMessage, type Peer } from '@komorebi/realtime';
import { expect, test, type Page } from '@playwright/test';

async function peers(page: Page): Promise<Peer[]> {
  const raw = await page.locator('.landscape').getAttribute('data-peers');
  const message = parseServerMessage(`{"type":"${MESSAGE.peers}","peers":${raw ?? '[]'}}`);
  return message?.type === MESSAGE.peers ? message.peers : [];
}
async function join(page: Page, nickname: string): Promise<void> {
  await expect(page.locator('.loading')).toHaveCount(0, { timeout: 20_000 });
  await page.getByRole('textbox', { name: '친구에게 보여줄 이름' }).fill(nickname);
  await page.getByRole('button', { name: /우리 산책 만들기|친구의 산책에 들어가기/ }).click();
  await expect(page.getByRole('button', { name: '초대 링크 복사' })).toBeVisible({ timeout: 15_000 });
}

test('an invitation connects desktop and phone walkers, shares movement and outfits, and removes departed peers', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const errors: string[] = [];
  host.on('pageerror', (error) => errors.push(error.message));
  guest.on('pageerror', (error) => errors.push(error.message));
  try {
    await host.goto('/');
    await host.getByRole('button', { name: '친구와 같이 걷기' }).click();
    await join(host, '단우');
    const link = await host.getByRole('textbox', { name: '초대 주소' }).inputValue();
    expect(new URL(link).hash).toMatch(/^#room=[a-f0-9]{32}$/);
    await host.getByRole('button', { name: '함께 산책하기' }).click();
    await guest.goto(link);
    await join(guest, '여름');
    await expect(guest.getByRole('list', { name: '함께 걷는 사람들' }).locator('li')).toHaveCount(2);
    await guest.getByRole('button', { name: '함께 산책하기' }).click();
    await expect(host.locator('.landscape')).toHaveAttribute('data-remote-actors', '1');
    await expect(guest.locator('.landscape')).toHaveAttribute('data-remote-actors', '1');
    const start = (await peers(guest))[0]?.walker.x ?? 0;
    await host.locator('.landscape canvas').focus();
    await host.keyboard.down('ArrowRight');
    try {
      await expect.poll(async () => (await peers(guest))[0]?.walker.x ?? 0).toBeGreaterThan(start + 2);
    } finally {
      await host.keyboard.up('ArrowRight');
    }
    await expect.poll(async () => (await peers(guest))[0]?.walker.isWalking).toBe(false);
    await host.getByRole('button', { name: '산책 옷 고르기' }).click();
    await host.getByRole('button', { name: '풀잎 멜빵옷' }).click();
    await expect.poll(async () => (await peers(guest))[0]?.walker.outfit).toBe('overalls');
    await host.getByRole('button', { name: '옷장 닫기' }).click();
    await guestContext.setOffline(true);
    await guest.getByRole('button', { name: '친구와 같이 걷기' }).click();
    await expect(guest.getByRole('dialog')).toContainText('다시 만나고 있어요', { timeout: 15_000 });
    await guestContext.setOffline(false);
    await expect(guest.getByRole('list', { name: '함께 걷는 사람들' }).locator('li')).toHaveCount(2, {
      timeout: 15_000,
    });
    await guest.getByRole('button', { name: '함께 산책하기' }).click();
    await host.getByRole('button', { name: '산책 지도 열기' }).click();
    await host.locator('.discovery-guide').filter({ hasText: '여름방학의 우리 교실' }).click();
    await expect(host.locator('.landscape')).toHaveAttribute('data-region', 'classroom', { timeout: 40_000 });
    await expect.poll(async () => (await peers(guest))[0]?.walker.region).toBe('classroom');
    await expect(guest.locator('.landscape')).toHaveAttribute('data-remote-actors', '0');
    await guest.getByRole('button', { name: '산책 지도 열기' }).click();
    await guest.locator('.discovery-guide').filter({ hasText: '여름방학의 우리 교실' }).click();
    await expect(guest.locator('.landscape')).toHaveAttribute('data-region', 'classroom', { timeout: 40_000 });
    await expect(guest.locator('.landscape')).toHaveAttribute('data-remote-actors', '1');
    await host.getByRole('button', { name: '친구와 같이 걷기' }).click();
    await host.getByRole('button', { name: '같이 걷기 나가기' }).click();
    await expect.poll(() => peers(guest)).toEqual([]);
    await expect(guest.locator('.landscape')).toHaveAttribute('data-remote-actors', '0');
    expect(new URL(host.url()).hash).toBe('');
    expect(errors).toEqual([]);
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});

test('the room server isolates invitations, limits capacity and rejects malformed state and foreign origins', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const denied = await request.get(`http://127.0.0.1:8787/rooms/${'b'.repeat(32)}`, {
    headers: { Upgrade: 'websocket', Origin: 'https://foreign.example' },
  });
  expect(denied.status()).toBe(403);
  const result = await page.evaluate(async () => {
    const room = crypto.randomUUID().replaceAll('-', '');
    const otherRoom = crypto.randomUUID().replaceAll('-', '');
    const sockets: WebSocket[] = [];
    const walker = {
      region: 'village',
      x: 50,
      z: 82,
      heading: 0,
      isWalking: false,
      isRunning: false,
      jumpHeight: 0,
      outfit: 'summer',
    };
    async function connect(roomId: string, nickname: string): Promise<{ socket: WebSocket; message: unknown }> {
      const socket = new WebSocket(`ws://127.0.0.1:8787/rooms/${roomId}`);
      sockets.push(socket);
      const message: unknown = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Join timeout')), 8_000);
        socket.onopen = () =>
          socket.send(JSON.stringify({ type: 'hello', nickname, walker, climate: { time: 'day', weather: 'clear' } }));
        socket.onmessage = (event: MessageEvent<unknown>) => {
          clearTimeout(timeout);
          resolve(typeof event.data === 'string' ? JSON.parse(event.data) : null);
        };
        socket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Connection failed'));
        };
      });
      return { socket, message };
    }
    function peerCount(value: unknown): number {
      return typeof value === 'object' && value !== null && 'peers' in value && Array.isArray(value.peers)
        ? value.peers.length
        : -1;
    }
    try {
      for (let index = 0; index < 4; index++) await connect(room, `친구${index}`);
      const full = await connect(room, '다섯째');
      const isolated = await connect(otherRoom, '혼자');
      const invalid: unknown = await new Promise((resolve) => {
        isolated.socket.onmessage = (event: MessageEvent<unknown>) => {
          if (typeof event.data !== 'string') return;
          const value: unknown = JSON.parse(event.data);
          if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'error') resolve(value);
        };
        isolated.socket.send(JSON.stringify({ type: 'move', walker: { ...walker, x: -100 } }));
      });
      return { full: full.message, isolatedCount: peerCount(isolated.message), invalid };
    } finally {
      sockets.forEach((socket) => socket.close());
    }
  });
  expect(result.full).toEqual({ type: MESSAGE.error, reason: 'full' });
  expect(result.isolatedCount).toBe(1);
  expect(result.invalid).toEqual({ type: MESSAGE.error, reason: 'invalid' });
});
