'use client';

import { TRACKS } from '@entities/track/model/constants/tracks';
import { usePlaybackControls } from '@entities/track/model/hooks/usePlaybackControls';
import { currentIndexAtom, frameState, isPlayingAtom, repeatOneAtom, shuffleAtom } from '@entities/track/model/store';
import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue } from 'jotai';
import { useRef } from 'react';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatOneIcon, ShuffleIcon } from './icons';
import { Scrubber } from './Scrubber';

const ICON_BUTTON =
  'text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft aria-[pressed=true]:text-brass grid size-[38px] place-items-center rounded-full transition-colors duration-200 outline-none';

// 위젯이 길이를 알려주기 전이나 콜백이 undefined를 줬을 때 NaN:NaN이 뜨지 않게 한다.
const clock = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
};

export function Transport() {
  const { toggle, step } = usePlaybackControls();
  const isPlaying = useAtomValue(isPlayingAtom);
  const index = useAtomValue(currentIndexAtom);
  const [shuffle, setShuffle] = useAtom(shuffleAtom);
  const [repeatOne, setRepeatOne] = useAtom(repeatOneAtom);
  const elapsed = useRef<HTMLElement | null>(null);
  const track = TRACKS[index];

  useFrame(() => {
    if (!elapsed.current) return;
    elapsed.current.textContent = clock((frameState.position * frameState.durationMs) / 1000);
  });

  return (
    <div className="border-t-hairline-soft order-3 col-span-full flex flex-col gap-sm border-t bg-void/95 px-md pt-md pb-md backdrop-blur-md">
      <Scrubber />
      <div className="font-label text-mute grid grid-cols-[1fr_auto_1fr] items-center gap-sm text-[10px] tracking-label tabular-nums uppercase">
        <span>
          <b ref={elapsed} className="text-paper font-normal">
            0:00
          </b>
        </span>
        <div className="flex items-center justify-center gap-xs">
          <button
            type="button"
            aria-pressed={shuffle}
            aria-label="임의재생"
            title="임의재생"
            className={ICON_BUTTON}
            onClick={() => setShuffle((value) => !value)}
          >
            <ShuffleIcon />
          </button>
          <button
            type="button"
            aria-label="이전 곡"
            title="이전 곡 · Shift+P"
            className={ICON_BUTTON}
            onClick={() => step(-1)}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            aria-label={isPlaying ? '일시정지' : '재생'}
            title="재생 · Space / K"
            className="text-void bg-paper hover:bg-white focus-visible:bg-white grid size-[46px] place-items-center rounded-full transition-colors duration-200 outline-none"
            onClick={toggle}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button
            type="button"
            aria-label="다음 곡"
            title="다음 곡 · Shift+N"
            className={ICON_BUTTON}
            onClick={() => step(1)}
          >
            <NextIcon />
          </button>
          <button
            type="button"
            aria-pressed={repeatOne}
            aria-label="한곡 반복"
            title="한곡 반복"
            className={ICON_BUTTON}
            onClick={() => setRepeatOne((value) => !value)}
          >
            <RepeatOneIcon />
          </button>
        </div>
        <span className="text-right">
          {track ? clock(track.durationMs / 1000) : '0:00'}{' '}
          {track ? (
            <a
              href={track.permalinkUrl}
              target="_blank"
              rel="noopener"
              className="decoration-hairline hover:text-paper focus-visible:text-paper underline underline-offset-[3px]"
            >
              SoundCloud
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}
