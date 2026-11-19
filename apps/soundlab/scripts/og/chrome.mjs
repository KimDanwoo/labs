import { HEIGHT, WIDTH } from './config.mjs';

export const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const CHROME_FLAGS = [
  '--headless=new',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--window-size=${WIDTH},${HEIGHT}`,
];

export function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let seq = 0;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const settle = pending.get(message.id);
    if (!settle) return;
    pending.delete(message.id);
    if (message.error) settle.reject(new Error(message.error.message));
    else settle.resolve(message.result);
  });

  const open = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('CDP 연결 실패')), { once: true });
  });

  return {
    open,
    send: (method, params) =>
      new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      }),
    close: () => socket.close(),
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function poll(read, ok, { tries = 60, gap = 250, label }) {
  for (let i = 0; i < tries; i++) {
    const value = await read().catch(() => null);
    if (value !== null && ok(value)) return value;
    await sleep(gap);
  }
  throw new Error(`${label} 대기 시간 초과`);
}
