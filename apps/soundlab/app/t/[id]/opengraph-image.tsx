import { artworkUrl, TRACKS } from '@entities/track';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'soundlab 곡 카드';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return TRACKS.map((track) => ({ id: String(track.id) }));
}

const VOID = '#050607';
const PAPER = '#f2f3f5';
const MUTE = '#f2f3f56b';
const BRASS = '#c8a97e';

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

const clock = (ms: number) => {
  const total = Math.round(ms / MS_PER_SECOND);
  return `${Math.floor(total / SECONDS_PER_MINUTE)}:${String(total % SECONDS_PER_MINUTE).padStart(2, '0')}`;
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = TRACKS.find((item) => String(item.id) === id) ?? TRACKS[0];
  if (!track) return new ImageResponse(<div style={{ background: VOID, width: '100%', height: '100%' }} />, size);

  const font = await readFile(join(process.cwd(), 'assets', 'og-title.ttf'));

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
        <div style={{ color: MUTE, fontSize: 28, letterSpacing: 4 }}>
          {`DANWOO · ${track.genre} · ${clock(track.durationMs)}`}
        </div>
      </div>
    </div>,
    { ...size, fonts: [{ name: 'GothicA1', data: font, style: 'normal', weight: 700 }] },
  );
}
