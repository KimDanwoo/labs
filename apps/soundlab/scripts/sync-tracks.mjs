#!/usr/bin/env node
// 전체 페이지를 성공적으로 읽은 경우에만 아카이브를 갱신한다.
import { existsSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchCatalog, mergeCatalog, renderCatalog } from './catalog.mjs';

const USER_ID = 51779680;
const PROFILE = 'https://soundcloud.com/danwooking/tracks';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36';
const TIMEOUT_MS = 20_000;

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'entities',
  'track',
  'model',
  'constants',
  'tracks.ts',
);

// ImageResponse가 process.cwd() 기준으로 읽는다. 앱 루트의 assets/ 에 둔다.
const FONT_OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'og-title.ttf');

const warn = (message) => console.warn(`[sync-tracks] ${message}`);

async function get(url, userAgent = UA) {
  const res = await fetch(url, { headers: { 'user-agent': userAgent }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`요청 실패: HTTP ${res.status} (${new URL(url).hostname})`);
  return res;
}

async function findClientId() {
  const html = await (await get(PROFILE)).text();
  const bundles = [...html.matchAll(/<script[^>]+src="(https:\/\/a-v2\.sndcdn\.com[^"]+)"/g)].map((m) => m[1]);
  // client_id는 보통 마지막에 로드되는 번들에 있다
  for (const src of bundles.reverse()) {
    const hit = (await (await get(src)).text()).match(/client_id[=:"]{1,3}([a-zA-Z0-9]{32})/);
    if (hit) return hit[1];
  }
  throw new Error('번들에서 client_id를 찾지 못했습니다');
}

/**
 * OG 카드에 곡 제목을 그리려면 폰트를 바이너리로 넣어야 한다(Satori는 시스템 폰트를 안 쓴다).
 * 한글 폰트 원본은 수 MB라 ImageResponse의 500KB 한도를 넘는다. Google Fonts는 `text=`로
 * 요청한 글자만 담은 서브셋을 주고, 제목에 쓰인 글자 전체가 수십 KB로 떨어진다.
 * 제목이 바뀌면 필요한 글자도 바뀌므로 곡 목록과 같은 시점에 다시 만든다.
 */
async function writeOgFont(tracks) {
  const used = tracks.map((t) => `${t.title}${t.genre}`).join('');
  const chars = [...new Set(`${used}SOUNDLABDANWOO 0123456789:·`.split(''))].sort().join('');
  const api = `https://fonts.googleapis.com/css2?family=Gothic+A1:wght@700&text=${encodeURIComponent(chars)}`;
  // 구형 UA로 요청해야 woff2 대신 ttf를 준다. ImageResponse는 woff2를 못 읽는다.
  const css = await (await get(api, 'Mozilla/4.0')).text();
  const found = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
  if (!found) throw new Error('구글 폰트 응답에서 ttf URL을 찾지 못했습니다');

  const font = Buffer.from(await (await get(found[1])).arrayBuffer());
  writeFileSync(FONT_OUT, font);
  console.log(
    `[sync-tracks] OG 폰트 서브셋 ${(font.length / 1024).toFixed(1)}KB (${chars.length}자) → ${FONT_OUT.replace(process.cwd(), '.')}`,
  );
}

let phase = '연결';
try {
  const previous = existsSync(OUT) ? (await import(pathToFileURL(OUT).href)).TRACKS : [];
  const clientId = await findClientId();
  phase = '곡 목록 검증';
  const current = await fetchCatalog({
    firstUrl: `https://api-v2.soundcloud.com/users/${USER_ID}/tracks?client_id=${clientId}&limit=50&linked_partitioning=1`,
    getJson: async (href) => {
      const url = new URL(href);
      url.searchParams.set('client_id', clientId);
      return (await get(url)).json();
    },
  });
  const tracks = mergeCatalog(current, previous);
  phase = 'OG 폰트';
  await writeOgFont(tracks);
  writeFileSync(`${OUT}.tmp`, renderCatalog(tracks), 'utf8');
  renameSync(`${OUT}.tmp`, OUT);
  process.stdout.write(`[sync-tracks] 공개 ${current.length}곡 · 보존 ${tracks.length - current.length}곡\n`);
} catch (error) {
  // 에러 객체/요청 URL에는 client_id 등이 포함될 수 있어 고정 메시지만 보고한다.
  const detail =
    error instanceof Error && /^(곡 |유효하지|허용하지|빈 목록|요청 실패)/.test(error.message)
      ? error.message
      : '외부 응답을 받지 못했습니다';
  warn(`${phase} 단계 실패: ${detail}. 기존 곡 목록과 공유 URL을 보존했습니다.`);
  process.exitCode = process.argv.includes('--strict') || !existsSync(OUT) ? 1 : 0;
}
