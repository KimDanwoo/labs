/**
 * OG 이미지를 실제 렌더러로 찍는다.
 *
 * Satori(`opengraph-image.tsx`)는 WebGL을 못 그려서 이 앱의 정체성을 담지 못한다.
 * 대신 `renderer.ts`를 Node의 타입 스트리핑으로 JS로 만들어 정적 페이지에 넣고,
 * morph를 원하는 값에 고정한 뒤 headless Chrome을 CDP로 붙여 캡처한다.
 * 앱 코드에 디버그 훅을 심지 않기 위한 선택이다 — 렌더러가 React와 분리돼 있어 가능하다.
 *
 *   pnpm --filter soundlab og                      # 기본 곡으로 app/opengraph-image.png 갱신
 *   pnpm --filter soundlab og --track=9
 *   pnpm --filter soundlab og --tracks=0,9,16 --outdir=/tmp/og   # 후보 비교용
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRACKS } from '../src/entities/track/model/constants/tracks.ts';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const RENDERER = join(HERE, '../src/widgets/stage/lib/renderer.ts');
const DEFAULT_OUT = join(HERE, '../app/opengraph-image.png');

const WIDTH = 1200;
const HEIGHT = 630;
/**
 * 그림이 읽히면서도 가장자리 픽셀은 아직 흩어져 있는 지점.
 * 셰이더가 휘도별로 `delay`(최대 0.44)를 주기 때문에 실효 진행도는 이보다 한참 낮다 —
 * 0.6에서는 형체가 안 보이고 1.0이면 그냥 앨범 커버가 된다. 눈으로 스윕해 고른 값.
 */
const MORPH = 0.97;
/**
 * 액자 한 변. 흩어진 픽셀이 액자 밖 30px 남짓까지 날아가므로
 * (630 - SLOT) / 2 가 그보다 커야 아래위가 잘리지 않는다.
 */
const SLOT = 410;
/** 아트 중심 x. 왼쪽을 워드마크에 내주는 2단 구성. */
const SLOT_CENTER_X = 796;
/** 20 Gothic Gravity — 밝은 코어가 썸네일에서도 초점을 만들고 반짝이는 질감이 파티클과 겹친다. */
const DEFAULT_TRACK = 20;

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_FLAGS = [
  '--headless=new',
  '--disable-gpu',
  '--enable-unsafe-swiftshader',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--window-size=${WIDTH},${HEIGHT}`,
];

const arg = (name) => process.argv.find((v) => v.startsWith(`--${name}=`))?.slice(name.length + 3);

const artworkUrl = (track) => `${track.artworkBase}-t500x500${track.artworkExt}`;

function page({ artwork, morph }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@800&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #050607; }
  canvas { position: fixed; inset: 0; width: ${WIDTH}px; height: ${HEIGHT}px; }
  /* 렌더러가 rect를 읽어 파티클이 모일 자리를 잡는다. 보이지는 않는다. */
  #slot {
    position: absolute; width: ${SLOT}px; height: ${SLOT}px;
    left: ${SLOT_CENTER_X - SLOT / 2}px; top: ${(HEIGHT - SLOT) / 2}px;
  }
  #mark {
    position: absolute; left: 78px; top: 50%; transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 18px;
  }
  #mark b {
    font: 800 54px/1 'Gothic A1', system-ui, sans-serif;
    letter-spacing: -0.02em; color: #f2f3f5;
  }
  #mark span {
    font: 500 14px/1 'IBM Plex Mono', ui-monospace, monospace;
    letter-spacing: 0.24em; text-transform: uppercase; color: #c8a97e;
  }
</style>
</head>
<body>
<canvas id="stage"></canvas>
<div id="slot"></div>
<div id="mark"><b>soundlab</b><span>DANWOO · 24 TRACKS</span></div>
<script type="module">
import { createRenderer } from './renderer.js';

const fail = (why) => { document.title = 'err:' + why; };

const load = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('artwork'));
  image.src = src;
});

try {
  const renderer = createRenderer(document.getElementById('stage'));
  if (!renderer) throw new Error('webgl2');

  const [image] = await Promise.all([load(${JSON.stringify(artwork)}), document.fonts.ready]);

  renderer.layout(document.getElementById('slot').getBoundingClientRect());
  renderer.setArtwork(image);
  // 누적 버퍼가 ping-pong이라 decay=0이어도 두 타깃이 모두 채워지도록 몇 프레임 돌린다.
  for (let i = 0; i < 4; i++) renderer.render({ morph: ${morph}, level: 0, decay: 0 });

  document.title = 'ok';
} catch (error) {
  fail(error.message);
}
</script>
</body>
</html>`;
}

/** CDP는 요청마다 id를 붙여 응답을 맞춰야 한다. 얇은 래퍼로 감춘다. */
function connect(url) {
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

async function poll(read, ok, { tries = 60, gap = 250, label }) {
  for (let i = 0; i < tries; i++) {
    const value = await read().catch(() => null);
    if (value !== null && ok(value)) return value;
    await sleep(gap);
  }
  throw new Error(`${label} 대기 시간 초과`);
}

async function main() {
  const indexes = (arg('tracks') ?? arg('track') ?? String(DEFAULT_TRACK)).split(',').map((v) => Number(v.trim()));
  const outdir = arg('outdir');
  const morph = Number(arg('morph') ?? MORPH);

  for (const index of indexes) {
    if (!Number.isInteger(index) || !TRACKS[index]) throw new Error(`트랙 인덱스가 범위 밖입니다: ${index}`);
  }
  if (indexes.length > 1 && !outdir) throw new Error('여러 곡을 찍으려면 --outdir이 필요합니다');

  const work = await mkdtemp(join(tmpdir(), 'soundlab-og-'));
  const profile = await mkdtemp(join(tmpdir(), 'soundlab-chrome-'));
  let chrome;
  let server;

  try {
    await writeFile(
      join(work, 'renderer.js'),
      stripTypeScriptTypes(await readFile(RENDERER, 'utf8'), { mode: 'strip' }),
    );

    // 아트워크는 i1.sndcdn.com에 있다. 원격 이미지를 그대로 쓰면 texImage2D가 보안 오류로 막히므로
    // 받아서 같은 오리진으로 내보낸다.
    for (const index of indexes) {
      const response = await fetch(artworkUrl(TRACKS[index]));
      if (!response.ok) throw new Error(`아트워크 요청 실패(${index}): ${response.status}`);
      await writeFile(join(work, `art-${index}.img`), Buffer.from(await response.arrayBuffer()));
      await writeFile(join(work, `page-${index}.html`), page({ artwork: `./art-${index}.img`, morph }));
    }

    server = createServer(async (request, response) => {
      const name = decodeURIComponent(new URL(request.url, 'http://x').pathname).replace(/^\/+/, '');
      const body = await readFile(join(work, name)).catch(() => null);
      if (!body) return response.writeHead(404).end();
      const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.js') ? 'text/javascript' : 'image/*';
      response.writeHead(200, { 'content-type': type }).end(body);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;

    chrome = spawn(
      CHROME,
      [...CHROME_FLAGS, `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'],
      {
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    // 포트를 0으로 열면 실제 포트는 stderr의 DevTools 배너로만 알 수 있다.
    const devtools = await new Promise((resolve, reject) => {
      let buffer = '';
      chrome.stderr.on('data', (chunk) => {
        buffer += chunk;
        const found = buffer.match(/ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (found) resolve(Number(found[1]));
      });
      chrome.on('exit', (code) => reject(new Error(`Chrome이 종료됨(${code})`)));
      setTimeout(() => reject(new Error('Chrome 기동 시간 초과')), 20_000);
    });

    const targets = await poll(
      () => fetch(`http://127.0.0.1:${devtools}/json/list`).then((r) => r.json()),
      (list) => list.some((t) => t.type === 'page'),
      { label: 'DevTools 타깃' },
    );
    const cdp = connect(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await cdp.open;
    await cdp.send('Page.enable');
    // --window-size는 브라우저 크롬을 포함해 뷰포트가 더 작아진다(1200×630 → 1200×543).
    // OG 비율(1.91:1)이 깨지므로 뷰포트를 정확히 강제한다.
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const index of indexes) {
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

    cdp.close();
  } finally {
    if (chrome) {
      // Chrome이 프로필에 쓰는 중에 지우면 ENOTEMPTY로 실패한다. 종료를 기다린다.
      chrome.kill();
      await once(chrome, 'exit').catch(() => undefined);
    }
    server?.close();
    await rm(work, { recursive: true, force: true });
    await rm(profile, { recursive: true, force: true });
  }
}

await main();
