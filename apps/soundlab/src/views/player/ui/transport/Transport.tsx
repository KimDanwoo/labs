'use client';

import { useAtomValue } from 'jotai';

import { TRACKS } from '@entities/track';
import { formatDurationMs } from '../../lib/formatTrack';
import { currentIndexAtom } from '../../model/store/playback';

import { useElapsedClock } from '../../model/hooks/useElapsedClock';
import { PlaybackButtons } from './PlaybackButtons';
import { Scrubber } from './Scrubber';

export function Transport() {
  const track = TRACKS[useAtomValue(currentIndexAtom)];
  const elapsedRef = useElapsedClock();

  return (
    <div className="border-t-hairline-soft order-3 col-span-full flex flex-col gap-sm border-t bg-void/95 px-md pt-md pb-md backdrop-blur-md">
      <Scrubber />
      {/* 좁은 화면에선 시간 / 컨트롤 / 링크를 3행으로 접는다 — 한 줄에 넣으면 44px 터치 타깃
          5개를 min-content로도 못 담아 그리드가 넘치고 오른쪽이 잘린다. */}
      <div className="font-label text-mute grid grid-cols-[1fr_auto] items-center gap-sm text-[10px] tracking-label tabular-nums uppercase min-[820px]:grid-cols-[1fr_auto_1fr]">
        <span className="col-start-1 row-start-1 flex min-w-0 items-center gap-md">
          <span className="max-w-40 truncate text-xs tracking-normal normal-case text-dim" title={track?.title}>
            {track?.title}
          </span>
          <b ref={elapsedRef} className="text-paper font-normal">
            0:00
          </b>
        </span>
        <PlaybackButtons />
        {/* 모바일에선 길이는 시간 행 오른쪽, 사운드클라우드 링크는 맨 아래 행으로 흩어져야 한다.
            래퍼를 contents로 지워 자식이 직접 그리드 아이템이 되게 하고, 820px부터 래퍼를 되살려 한 줄로 묶는다. */}
        <span className="contents min-[820px]:col-start-3 min-[820px]:row-start-1 min-[820px]:flex min-[820px]:items-center min-[820px]:justify-end min-[820px]:gap-xs min-[820px]:text-right">
          <span className="col-start-2 row-start-1 justify-self-end">
            {track ? formatDurationMs(track.durationMs) : '0:00'}
          </span>
          <span className="col-start-1 col-end-3 row-start-3 flex items-center justify-center">
            {track ? (
              <a
                href={track.permalinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-hairline hover:text-paper focus-visible:text-paper py-sm underline underline-offset-[3px] min-[820px]:py-0"
              >
                SoundCloud
              </a>
            ) : null}
          </span>
        </span>
      </div>
    </div>
  );
}
