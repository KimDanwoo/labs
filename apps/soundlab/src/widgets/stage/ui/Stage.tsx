'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { artworkUrl } from '@entities/track/model/services';
import { currentIndexAtom, engineErrorAtom } from '@entities/track/model/store';
import { useAtomValue } from 'jotai';
import { useCallback, useRef, useState } from 'react';
import { ParticleCanvas } from './ParticleCanvas';

/**
 * 파티클이 모일 자리를 .slot으로 예약한다. 렌더러가 이 요소의 rect를 읽어 좌표를 잡는다.
 * 캔버스가 붙기 전까지는 아트워크를 img로 깔아 빈 무대를 보여주지 않고,
 * WebGL2를 못 쓰는 환경에서는 그 img가 그대로 폴백이 된다.
 */
export function Stage() {
  const index = useAtomValue(currentIndexAtom);
  const engineError = useAtomValue(engineErrorAtom);
  const slot = useRef<HTMLDivElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const track = TRACKS[index];

  const handleReady = useCallback((ready: boolean) => setCanvasReady(ready), []);

  return (
    // overflow-hidden: 아트워크는 shrink-0라, 남는 높이가 부족해도 목록·재생바 위로 삐져나오지 않게 가둔다.
    <section className="order-1 flex min-h-0 flex-col items-center justify-center gap-lg overflow-hidden p-md min-[820px]:order-2">
      <ParticleCanvas slotRef={slot} onReady={handleReady} />
      {/* 목록이 따로 화면을 가져가 무대가 넓어졌으니 커버를 폭 상한까지 키운다.
          dvh 천장은 세로가 짧은 기기에서만 걸린다 — vh는 모바일에서 주소창까지 포함해 실제보다 크다. */}
      <div ref={slot} className="aspect-square w-[min(84%,46dvh)] shrink-0 min-[820px]:w-[min(64%,58vh)]">
        {track && !canvasReady ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkUrl(track, 't500x500')} alt="" className="size-full object-cover" draggable={false} />
        ) : null}
      </div>
      {/* 제목이 먼저, 장르가 아래 — 순번(01/25)은 목록 화면의 각 행이 이미 들고 있어 여기선 뺀다. */}
      <div className="flex max-w-[34ch] flex-col items-center gap-xs text-center">
        <h2 className="text-[clamp(22px,2.7vw,38px)] leading-tight font-extrabold tracking-tight break-keep text-balance">
          {track?.title ?? ''}
        </h2>
        <span className="font-label text-mute text-[10px] tracking-wide-label uppercase">{track?.genre ?? ''}</span>
        {engineError ? (
          <p role="alert" className="font-label text-error text-[10px] tracking-label">
            재생 엔진을 불러오지 못했습니다: {engineError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
