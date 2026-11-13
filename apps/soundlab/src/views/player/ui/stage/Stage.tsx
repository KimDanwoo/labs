'use client';

import { artworkUrl, currentIndexAtom, TRACKS } from '@entities/track';
import { useAtomValue } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { VISUAL_MODE, visualModeAtom } from '../../model/visual';
import { FavoriteButton } from '../library/FavoriteButton';
import { ParticleCanvas } from './ParticleCanvas';
import { PlaybackStatus } from './PlaybackStatus';
import { TrackDetails } from './TrackDetails';
import { VisualSettings } from './VisualSettings';

/**
 * 파티클이 모일 자리를 .slot으로 예약한다. 렌더러가 이 요소의 rect를 읽어 좌표를 잡는다.
 * 캔버스가 붙기 전까지는 아트워크를 img로 깔아 빈 무대를 보여주지 않고,
 * WebGL2를 못 쓰는 환경에서는 그 img가 그대로 폴백이 된다.
 */
export function Stage() {
  const index = useAtomValue(currentIndexAtom);
  const visualMode = useAtomValue(visualModeAtom);
  const isStill = visualMode === VISUAL_MODE.still;
  const slot = useRef<HTMLDivElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const track = TRACKS[index];

  const handleReady = useCallback((ready: boolean) => setCanvasReady(ready), []);

  return (
    <section className="stage order-1 relative flex min-h-0 flex-col items-center justify-center gap-md overflow-y-auto p-md pt-3xl min-[820px]:order-2">
      <div className="stage-caption absolute top-md inset-x-md flex justify-between font-label text-xs text-mute">
        <span>현재 곡</span>
        <span>
          {String(index + 1).padStart(2, '0')} / {TRACKS.length}
        </span>
      </div>
      {!isStill ? <ParticleCanvas slotRef={slot} onReady={handleReady} /> : null}
      {/* 목록이 따로 화면을 가져가 무대가 넓어졌으니 커버를 폭 상한까지 키운다.
          dvh 천장은 세로가 짧은 기기에서만 걸린다 — vh는 모바일에서 주소창까지 포함해 실제보다 크다. */}
      <div ref={slot} className="aspect-square w-[min(84%,46dvh)] shrink-0 min-[820px]:w-[min(64%,58vh)]">
        {track && (!canvasReady || isStill) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkUrl(track, 't500x500')} alt="" className="size-full object-cover" draggable={false} />
        ) : null}
      </div>
      <div className="flex max-w-[34ch] flex-col items-center gap-xs text-center">
        <h2 className="text-[clamp(22px,2.7vw,38px)] leading-tight font-bold tracking-tight break-keep text-balance">
          {track?.title ?? ''}
        </h2>
        <span className="font-label text-mute text-[10px] tracking-wide-label uppercase">{track?.genre ?? ''}</span>
        <div className="flex flex-wrap items-center justify-center gap-xs">
          {track ? <FavoriteButton trackId={track.id} title={track.title} /> : null}
          <TrackDetails />
          <VisualSettings />
        </div>
        <PlaybackStatus />
      </div>
    </section>
  );
}
