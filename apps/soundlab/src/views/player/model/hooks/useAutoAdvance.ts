'use client';

import { REPEAT_MODE } from '@views/player/model/constants/repeatMode';
import type { PlaybackEngine } from '@views/player/model/hooks/useEngineRefs';
import { playableIds, resolveQueue } from '@views/player/model/queue';
import {
  currentIndexAtom,
  isPlayingAtom,
  playbackQueueAtom,
  repeatModeAtom,
  shuffleAtom,
} from '@views/player/model/store/playback';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

interface WidgetAdvanceInput {
  hasQueue: boolean;
  holdsSet: boolean;
  shuffle: boolean;
  soundIds: (number | null)[];
  trackId: number;
}

function isWidgetAdvancing({ hasQueue, holdsSet, shuffle, soundIds, trackId }: WidgetAdvanceInput): boolean {
  if (hasQueue || !holdsSet || shuffle) return false;
  const soundIndex = soundIds.indexOf(trackId);
  return soundIndex >= 0 && soundIndex < soundIds.length - 1;
}

type Widget = PlaybackEngine['refs']['widgetRef']['current'];

function replayCurrent(widget: Widget): void {
  widget?.seekTo(0);
  widget?.play();
}

export function useAutoAdvance({ tracks, refs }: PlaybackEngine, step: (direction: 1 | -1) => void) {
  const { widgetRef, advanceRef, holdsSetRef, soundIdsRef, shouldRewindRef } = refs;
  const index = useAtomValue(currentIndexAtom);
  const queue = useAtomValue(playbackQueueAtom);
  const shuffle = useAtomValue(shuffleAtom);
  const repeatMode = useAtomValue(repeatModeAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);

  useEffect(() => {
    advanceRef.current = () => {
      if (repeatMode === REPEAT_MODE.one) {
        replayCurrent(widgetRef.current);
        return;
      }

      // 세트 안이고 뒤에 곡이 더 남았으면 위젯이 스스로 넘긴다(play 이벤트로 인덱스가 동기화된다).
      // 새 재생을 시작하지 않는 경로라 백그라운드에서도 이어지므로, 여기서 가로채지 않는다.
      // 세트의 마지막 사운드였다면 위젯은 멈추므로 아래로 내려가 직접 넘긴다.
      const currentId = tracks[index]?.id ?? -1;
      const widgetAdvances = isWidgetAdvancing({
        hasQueue: Boolean(queue),
        holdsSet: holdsSetRef.current,
        shuffle,
        soundIds: soundIdsRef.current,
        trackId: currentId,
      });
      if (widgetAdvances) {
        shouldRewindRef.current = true;
        return;
      }

      // step(1)은 목록 끝에서 첫 곡으로 되돌아간다. 반복이 꺼져 있으면 거기서 멈춰야 한다.
      const ids = queue ? resolveQueue(tracks, queue.ids) : playableIds(tracks);
      const isLastTrack = tracks[index]?.id === ids.at(-1);
      if (isLastTrack && repeatMode === REPEAT_MODE.off) {
        widgetRef.current?.pause();
        setIsPlaying(false);
        return;
      }
      step(1);
    };
  }, [
    advanceRef,
    holdsSetRef,
    index,
    queue,
    repeatMode,
    setIsPlaying,
    shouldRewindRef,
    shuffle,
    soundIdsRef,
    step,
    tracks,
    widgetRef,
  ]);
}
