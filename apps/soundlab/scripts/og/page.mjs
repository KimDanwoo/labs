import { HEIGHT, SLOT, SLOT_CENTER_X, WIDTH } from './config.mjs';

export function page({ artwork, morph }) {
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
