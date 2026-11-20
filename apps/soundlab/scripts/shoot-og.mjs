import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRACKS } from '../src/entities/track/model/constants/tracks.ts';
import { CHROME, CHROME_FLAGS, connect, poll } from './og/chrome.mjs';
import { DEFAULT_TRACK, HEIGHT, MORPH, WIDTH } from './og/config.mjs';
import { writeModuleGraph } from './og/moduleGraph.mjs';
import { page } from './og/page.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const RENDERER = join(HERE, '../src/views/player/lib/stage/renderer.ts');
const DEFAULT_OUT = join(HERE, '../app/opengraph-image.png');

const arg = (name) => process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3);

const artworkUrl = (track) => `${track.artworkBase}-t500x500${track.artworkExt}`;

const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const DEFAULT_CONTENT_TYPE = 'image/*';
const CHROME_START_TIMEOUT_MS = 20_000;

function parseTargets() {
  const indexes = (arg('tracks') ?? arg('track') ?? String(DEFAULT_TRACK)).split(',').map((v) => Number(v.trim()));
  const outdir = arg('outdir');
  const morph = Number(arg('morph') ?? MORPH);

  for (const index of indexes) {
    if (!Number.isInteger(index)) throw new Error(`트랙 인덱스가 범위 밖입니다: ${index}`);
    if (!TRACKS[index]) throw new Error(`트랙 인덱스가 범위 밖입니다: ${index}`);
  }
  const isMissingOutdir = indexes.length > 1 && !outdir;
  if (isMissingOutdir) throw new Error('여러 곡을 찍으려면 --outdir이 필요합니다');
  return { indexes, outdir, morph };
}

function contentTypeOf(name) {
  const extension = Object.keys(CONTENT_TYPES).find((ext) => name.endsWith(ext));
  return extension ? CONTENT_TYPES[extension] : DEFAULT_CONTENT_TYPE;
}

async function writeAssets(work, indexes, morph) {
  for (const index of indexes) {
    const response = await fetch(artworkUrl(TRACKS[index]));
    if (!response.ok) throw new Error(`아트워크 요청 실패(${index}): ${response.status}`);
    await writeFile(join(work, `art-${index}.img`), Buffer.from(await response.arrayBuffer()));
    await writeFile(join(work, `page-${index}.html`), page({ artwork: `./art-${index}.img`, morph }));
  }
}

function serveDirectory(work) {
  return createServer(async (request, response) => {
    const name = decodeURIComponent(new URL(request.url, 'http://x').pathname).replace(/^\/+/, '');
    const body = await readFile(join(work, name)).catch(() => null);
    if (!body) return response.writeHead(404).end();
    response.writeHead(200, { 'content-type': contentTypeOf(name) }).end(body);
  });
}

function readDevtoolsPort(chrome) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    chrome.stderr.on('data', (chunk) => {
      buffer += chunk;
      const found = buffer.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (found) resolve(Number(found[1]));
    });
    chrome.on('exit', (code) => reject(new Error(`Chrome이 종료됨(${code})`)));
    setTimeout(() => reject(new Error('Chrome 기동 시간 초과')), CHROME_START_TIMEOUT_MS);
  });
}

async function openPage(devtools) {
  const targets = await poll(
    () => fetch(`http://127.0.0.1:${devtools}/json/list`).then((r) => r.json()),
    (list) => list.some((t) => t.type === 'page'),
    { label: 'DevTools 타깃' },
  );
  const cdp = connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await cdp.open;
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return cdp;
}

async function shoot({ cdp, origin, index, outdir }) {
  const track = TRACKS[index];
  await cdp.send('Page.navigate', { url: `${origin}/page-${index}.html` });

  const title = await poll(
    () => cdp.send('Runtime.evaluate', { expression: 'document.title' }).then((r) => r.result.value ?? ''),
    (value) => value === 'ok' || value.startsWith('err:'),
    { label: `렌더 완료(${track.title})` },
  );
  if (title !== 'ok') throw new Error(`렌더 실패(${track.title}): ${title.slice(4)}`);

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const out = outdir ? join(outdir, `og-${index}.png`) : DEFAULT_OUT;
  await writeFile(out, Buffer.from(shot.data, 'base64'));
  console.log(`${out}  ←  ${index} ${track.title}`);
}

async function main() {
  const { indexes, outdir, morph } = parseTargets();
  const work = await mkdtemp(join(tmpdir(), 'soundlab-og-'));
  const profile = await mkdtemp(join(tmpdir(), 'soundlab-chrome-'));
  let chrome;
  let server;

  try {
    await writeModuleGraph(RENDERER, work, 'renderer.js');
    await writeAssets(work, indexes, morph);

    server = serveDirectory(work);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;

    chrome = spawn(
      CHROME,
      [...CHROME_FLAGS, `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    const cdp = await openPage(await readDevtoolsPort(chrome));

    for (const index of indexes) await shoot({ cdp, origin, index, outdir });

    cdp.close();
  } finally {
    if (chrome) {
      chrome.kill();
      await once(chrome, 'exit').catch(() => undefined);
    }
    server?.close();
    await rm(work, { recursive: true, force: true });
    await rm(profile, { recursive: true, force: true });
  }
}

await main();
