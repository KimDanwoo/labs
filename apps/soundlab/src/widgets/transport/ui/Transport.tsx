'use client';

import { REPEAT_LABEL, REPEAT_MODE, nextRepeatMode } from '@entities/track/model/constants/repeatMode';
import { TRACKS } from '@entities/track/model/constants/tracks';
import { usePlaybackControls } from '@entities/track/model/hooks/usePlaybackControls';
import { currentIndexAtom, frameState, isPlayingAtom, repeatModeAtom, shuffleAtom } from '@entities/track/model/store';
import { useFrame } from '@shared/lib/frame';
import { useAtom, useAtomValue } from 'jotai';
import { useRef } from 'react';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, RepeatOneIcon, ShuffleIcon } from './icons';
import { Scrubber } from './Scrubber';

// 켜짐 표시를 hover/focus가 덮지 않게 변형을 겹쳐 특정도를 올린다.
// (hover:text-paper 와 aria-[pressed=true]:text-brass 는 특정도가 같아 순서에 좌우된다 —
//  클릭 직후엔 커서가 버튼 위에 있으므로 그때 정확히 꺼진 것처럼 보였다.)
const ICON_BUTTON = [
  'grid size-11 place-items-center rounded-full outline-none',
  'transition-[color,background-color,transform] duration-150 active:scale-90',
  'text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft',
  'aria-[pressed=true]:text-brass aria-[pressed=true]:bg-brass/15',
  'aria-[pressed=true]:hover:text-brass aria-[pressed=true]:hover:bg-brass/25',
  'aria-[pressed=true]:focus-visible:text-brass aria-[pressed=true]:focus-visible:bg-brass/25',
].join(' ');

const PLAY_BUTTON = [
  'text-void bg-paper grid size-[54px] place-items-center rounded-full outline-none',
  'transition-[background-color,transform] duration-150 active:scale-90',
  'hover:bg-white focus-visible:bg-white',
].join(' ');

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
  const [repeatMode, setRepeatMode] = useAtom(repeatModeAtom);
  const elapsed = useRef<HTMLElement | null>(null);
  const track = TRACKS[index];

  useFrame(() => {
    if (!elapsed.current) return;
    elapsed.current.textContent = clock((frameState.position * frameState.durationMs) / 1000);
  });

  return (
    <div className="border-t-hairline-soft order-3 col-span-full flex flex-col gap-sm border-t bg-void/95 px-md pt-md pb-md backdrop-blur-md">
      <Scrubber />
      {/* 좁은 화면에선 시간 / 컨트롤 / 링크를 3행으로 접는다 — 한 줄에 넣으면 44px 터치 타깃
          5개를 min-content로도 못 담아 그리드가 넘치고 오른쪽이 잘린다. */}
      <div className="font-label text-mute grid grid-cols-[1fr_auto] items-center gap-sm text-[10px] tracking-label tabular-nums uppercase min-[820px]:grid-cols-[1fr_auto_1fr]">
        <span className="col-start-1 row-start-1">
          <b ref={elapsed} className="text-paper font-normal">
            0:00
          </b>
        </span>
        <div className="col-start-1 col-end-3 row-start-2 flex items-center justify-center gap-xs min-[820px]:col-start-2 min-[820px]:row-start-1">
          <button
            type="button"
            aria-pressed={shuffle}
            aria-label={`임의재생 ${shuffle ? '켬' : '끔'}`}
            title={`임의재생 ${shuffle ? '켬' : '끔'}`}
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
            title={`${isPlaying ? '일시정지' : '재생'} · Space / K`}
            className={PLAY_BUTTON}
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
            aria-pressed={repeatMode !== REPEAT_MODE.off}
            aria-label={`반복: ${REPEAT_LABEL[repeatMode]}`}
            title={`${REPEAT_LABEL[repeatMode]} · 눌러서 전환`}
            className={ICON_BUTTON}
            onClick={() => setRepeatMode(nextRepeatMode)}
          >
            {repeatMode === REPEAT_MODE.one ? <RepeatOneIcon /> : <RepeatIcon />}
          </button>
        </div>
        {/* 모바일에선 길이는 시간 행 오른쪽, 사운드클라우드 링크는 맨 아래 행으로 흩어져야 한다.
            래퍼를 contents로 지워 자식이 직접 그리드 아이템이 되게 하고, 820px부터 래퍼를 되살려 한 줄로 묶는다. */}
        <span className="contents min-[820px]:col-start-3 min-[820px]:row-start-1 min-[820px]:flex min-[820px]:items-center min-[820px]:justify-end min-[820px]:gap-xs min-[820px]:text-right">
          <span className="col-start-2 row-start-1 justify-self-end">
            {track ? clock(track.durationMs / 1000) : '0:00'}
          </span>
          <span className="col-start-1 col-end-3 row-start-3 flex items-center justify-center">
            {track ? (
              <a
                href={track.permalinkUrl}
                target="_blank"
                rel="noopener"
                // py-sm: 링크 하나만 남은 행이라 최소 터치 타깃(24px)을 패딩으로 확보한다.
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
