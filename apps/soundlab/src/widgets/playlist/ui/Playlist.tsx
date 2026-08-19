'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { usePlaybackControls } from '@entities/track/model/hooks/usePlaybackControls';
import { currentIndexAtom } from '@entities/track/model/store';
import { TrackRow } from '@entities/track/ui';
import { ScrollArea } from '@ui/react';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';

const totalLabel = (() => {
  const seconds = TRACKS.reduce((sum, track) => sum + track.durationMs, 0) / 1000;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
})();

export function Playlist() {
  const index = useAtomValue(currentIndexAtom);
  const { select } = usePlaybackControls();
  const list = useRef<HTMLDivElement | null>(null);

  // 곡이 바뀌면 그 행이 보이게 한다.
  useEffect(() => {
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  return (
    <aside className="border-t-hairline-soft min-[820px]:border-r-hairline-soft order-2 flex min-h-0 flex-col border-t bg-void/95 backdrop-blur-md min-[820px]:order-1 min-[820px]:border-t-0 min-[820px]:border-r">
      <div className="border-b-hairline-soft flex flex-col gap-xs border-b p-md">
        <h1 className="font-label text-[11px] font-medium tracking-mark uppercase">soundlab</h1>
        <p className="font-label text-mute text-[10px] tracking-label break-keep tabular-nums uppercase">
          Danwoo · {TRACKS.length} tracks · {totalLabel}
        </p>
      </div>
      {/* 오버레이 스크롤 — 레이아웃을 밀지 않고 호버할 때만 보인다 */}
      <ScrollArea
        ref={list}
        type="hover"
        scrollHideDelay={400}
        className="min-h-0 flex-1 **:data-[slot=scroll-area-scrollbar]:w-1.5 **:data-[slot=scroll-area-scrollbar]:border-l-0 **:data-[slot=scroll-area-thumb]:bg-hairline"
      >
        <div className="py-xs">
          {TRACKS.map((track, position) => (
            <TrackRow key={track.id} track={track} index={position} isCurrent={position === index} onSelect={select} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
