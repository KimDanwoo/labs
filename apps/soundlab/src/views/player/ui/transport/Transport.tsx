'use client';

import { useAtomValue } from 'jotai';

import { TRACKS } from '@entities/track';
import { formatDurationMs } from '@views/player/lib/formatTrack';
import { currentIndexAtom } from '@views/player/model/store/playback';

import { useElapsedClock } from '@views/player/model/hooks/useElapsedClock';
import { PlaybackButtons } from '@views/player/ui/transport/PlaybackButtons';
import { Scrubber } from '@views/player/ui/transport/Scrubber';

export function Transport() {
  const track = TRACKS[useAtomValue(currentIndexAtom)];
  const elapsedRef = useElapsedClock();

  return (
    <div className="border-t-hairline-soft order-3 col-span-full flex flex-col gap-sm border-t bg-void/95 px-md pt-md pb-md backdrop-blur-md">
      <Scrubber />
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
