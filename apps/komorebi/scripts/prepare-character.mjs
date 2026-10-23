import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

// Requires Chrome (CHROME_BIN outside macOS) and cwebp. No server or GPU needed.
const root = new URL('../', import.meta.url);
const temporary = await mkdtemp(join(tmpdir(), 'komorebi-character-'));
const source = await readFile(new URL('public/art/child-motion-v2-atlas.webp', root));
const modules = await Promise.all([
  readFile(new URL('src/features/walk/lib/atlas.ts', root), 'utf8'),
  readFile(new URL('scripts/prepareChildAtlas.ts', root), 'utf8'),
]);
const javascript = modules
  .map(
    (code) =>
      ts.transpileModule(code.replace(/^import .*;\n/gm, '').replace(/^export /gm, ''), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      }).outputText,
  )
  .join('\n');
const server = createServer((request, response) => {
  if (request.url === '/source.webp') {
    response.setHeader('Content-Type', 'image/webp');
    response.end(source);
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<script>${javascript}</script>`);
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const chrome = spawn(
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  [
    '--headless',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${temporary}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      port = (await readFile(join(temporary, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      break;
    } catch {
      await sleep(100);
    }
  }
  if (!port) throw new Error('Chrome did not start; check CHROME_BIN');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(message.error);
    else callback.resolve(message.result);
  });
  const send = (method, params) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('Page.navigate', { url: `http://127.0.0.1:${address.port}` });
  let result;
  for (let attempt = 0; attempt < 100; attempt++) {
    result = await send('Runtime.evaluate', { expression: 'typeof prepareChildAtlas' });
    if (result.result.value === 'function') break;
    await sleep(100);
  }
  result = await send('Runtime.evaluate', {
    expression: `(async () => {
      const image = new Image(); image.src = '/source.webp'; await image.decode();
      return prepareChildAtlas(image).toDataURL('image/png').split(',')[1];
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  const png = join(temporary, 'prepared.png');
  await writeFile(png, Buffer.from(result.result.value, 'base64'));
  execFileSync('cwebp', [
    '-lossless',
    '-quiet',
    png,
    '-o',
    new URL('public/art/child-motion-v2-ready.webp', root).pathname,
  ]);
  console.log('Prepared 32 aligned poses in child-motion-v2-ready.webp (lossless).');
} finally {
  ws?.close();
  chrome.kill();
  server.close();
  await new Promise((resolve) => (chrome.exitCode !== null ? resolve() : chrome.once('exit', resolve)));
  await rm(temporary, { recursive: true, force: true });
}
