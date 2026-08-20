'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { usePlaybackControls } from '@entities/track/model/hooks/usePlaybackControls';
import { currentIndexAtom } from '@entities/track/model/store';
import { TrackRow } from '@entities/track/ui';
import { ScrollArea } from '@ui/react';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { isPlaylistCollapsedAtom } from '../model/store';
import { PlaylistToggle } from './PlaylistToggle';

const totalLabel = (() => {
  const seconds = TRACKS.reduce((sum, track) => sum + track.durationMs, 0) / 1000;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
})();

/** 접었을 때 현재 곡만 남기려면 원래 순번이 필요하다. 인덱스를 잃지 않게 미리 짝지어 둔다. */
const ROWS = TRACKS.map((track, position) => ({ track, position }));

export function Playlist() {
  const index = useAtomValue(currentIndexAtom);
  const isCollapsed = useAtomValue(isPlaylistCollapsedAtom);
  const { select } = usePlaybackControls();
  const list = useRef<HTMLDivElement | null>(null);

  // 곡이 바뀌면 그 행이 보이게 한다. 접혀 있으면 그 행 하나뿐이라 할 일이 없다.
  useEffect(() => {
    if (isCollapsed) return;
    list.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index, isCollapsed]);

  const rows = isCollapsed ? ROWS.filter((row) => row.position === index) : ROWS;

  return (
    <aside
      id="playlist"
      // 데스크톱에서 접으면 열째로 사라져 무대가 풀블리드가 된다. 복귀 버튼은 PlayerView가 띄운다.
      className={`border-t-hairline-soft min-[820px]:border-r-hairline-soft order-2 flex min-h-0 flex-col border-t bg-void/95 backdrop-blur-md min-[820px]:order-1 min-[820px]:border-t-0 min-[820px]:border-r ${isCollapsed ? 'min-[820px]:hidden' : ''}`}
    >
      <div className="border-b-hairline-soft flex items-start justify-between gap-sm border-b p-md">
        <div className="flex min-w-0 flex-col gap-xs">
          <h1 className="font-label text-[11px] font-medium tracking-mark uppercase">soundlab</h1>
          <p className="font-label text-mute text-[10px] tracking-label break-keep tabular-nums uppercase">
            Danwoo · {TRACKS.length} tracks · {totalLabel}
          </p>
        </div>
        <PlaylistToggle className="-mr-xs" />
      </div>
      {/* 오버레이 스크롤 — 레이아웃을 밀지 않고 호버할 때만 보인다 */}
      <ScrollArea
        ref={list}
        type="hover"
        scrollHideDelay={400}
        className="min-h-0 flex-1 **:data-[slot=scroll-area-scrollbar]:w-1.5 **:data-[slot=scroll-area-scrollbar]:border-l-0 **:data-[slot=scroll-area-thumb]:bg-hairline"
      >
        <div className="py-xs">
          {rows.map(({ track, position }) => (
            <TrackRow key={track.id} track={track} index={position} isCurrent={position === index} onSelect={select} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
