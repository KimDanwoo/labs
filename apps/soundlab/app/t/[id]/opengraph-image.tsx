import { TRACKS } from '@entities/track/model/constants';
import { artworkUrl } from '@entities/track/model/services';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'soundlab 곡 카드';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 페이지의 generateStaticParams는 이 이미지 라우트까지 덮지 않는다. 여기에도 붙여야 빌드 타임에 굳는다.
export function generateStaticParams() {
  return TRACKS.map((track) => ({ id: String(track.id) }));
}

// 앱 팔레트와 맞춘다(globals.css의 --color-*). Satori는 CSS 변수를 못 읽어 값을 직접 쓴다.
const VOID = '#050607';
const PAPER = '#f2f3f5';
const MUTE = '#f2f3f56b';
const BRASS = '#c8a97e';

const clock = (ms: number) => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = TRACKS.find((item) => String(item.id) === id) ?? TRACKS[0];
  if (!track) return new ImageResponse(<div style={{ background: VOID, width: '100%', height: '100%' }} />, size);

  // Satori는 시스템 폰트를 쓰지 않는다. 한글을 그리려면 바이너리를 직접 넘겨야 한다.
  // 이 서브셋은 sync-tracks.mjs가 곡 제목에 쓰인 글자만 담아 만든다(20KB대).
  const font = await readFile(join(process.cwd(), 'assets', 'og-title.ttf'));

  // <img src="https://…">를 그대로 두면 Satori가 uncached fetch를 돌려 이 라우트가 통째로
  // 동적(ƒ)이 된다 — 크롤러가 올 때마다 함수가 뜬다. 직접 캐시 페치해 인라인하면 빌드 타임에 굳는다.
  const artwork = await fetch(artworkUrl(track, 't500x500'), { cache: 'force-cache' });
  const artworkSrc = `data:image/${track.artworkExt === '.png' ? 'png' : 'jpeg'};base64,${Buffer.from(
    await artwork.arrayBuffer(),
  ).toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 64,
        padding: 80,
        background: VOID,
        fontFamily: 'GothicA1',
      }}
    >
      <img src={artworkSrc} width={420} height={420} style={{ borderRadius: 8 }} alt="" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
        <div style={{ color: BRASS, fontSize: 26, letterSpacing: 10 }}>SOUNDLAB</div>
        <div style={{ color: PAPER, fontSize: 76, lineHeight: 1.15 }}>{track.title}</div>
        {/* Satori는 자식이 둘 이상인 div에 명시적 display를 요구한다. 한 문자열로 합쳐 자식을 하나로 둔다. */}
        <div style={{ color: MUTE, fontSize: 28, letterSpacing: 4 }}>
          {`DANWOO · ${track.genre} · ${clock(track.durationMs)}`}
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'GothicA1', data: font, style: 'normal', weight: 700 }] },
  );
}
