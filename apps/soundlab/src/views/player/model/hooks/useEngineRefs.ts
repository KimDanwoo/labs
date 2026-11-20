'use client';

import type { Track } from '@entities/track';
import type { ScWidget } from '@views/player/api/widget';
import type { PendingRewind } from '@views/player/lib/rewindGuard';
import type { useLastPlayed } from '@views/player/model/hooks/useLastPlayed';
import type { useListeningLog } from '@views/player/model/hooks/useListeningLog';
import type { usePlaybackClock } from '@views/player/model/hooks/usePlaybackClock';
import type { useVolumeFade } from '@views/player/model/hooks/useVolumeFade';
import type { PlaybackQueue } from '@views/player/model/queue';
import { type RefObject, useRef } from 'react';

export interface EngineRefs {
  widgetRef: RefObject<ScWidget | null>;
  readyRef: RefObject<boolean>;
  playingRef: RefObject<boolean>;
  advanceRef: RefObject<() => void>;
  holdsSetRef: RefObject<boolean>;
  soundIdsRef: RefObject<(number | null)[]>;
  heldIndexRef: RefObject<number>;
  shouldRewindRef: RefObject<boolean>;
  pendingRewindRef: RefObject<PendingRewind | null>;
  pauseAfterSwitchRef: RefObject<boolean>;
  resumeRef: RefObject<{ index: number; ms: number } | null>;
  goSeqRef: RefObject<number>;
  queuedRef: RefObject<number | null>;
  flushQueuedRef: RefObject<() => void>;
}

export interface PlaybackEngine {
  tracks: readonly Track[];
  refs: EngineRefs;
  queueRef: RefObject<PlaybackQueue | null>;
  clock: ReturnType<typeof usePlaybackClock>;
  listening: ReturnType<typeof useListeningLog>;
  volume: ReturnType<typeof useVolumeFade>;
  lastPlayed: ReturnType<typeof useLastPlayed>;
}

export function useEngineRefs(): EngineRefs {
  const widgetRef = useRef<ScWidget | null>(null);
  // api.js가 로드되면 widgetRef.current는 곧바로 채워지지만, iframe이 ready를 보내기 전까지
  // 메서드 호출(postMessage)은 받는 쪽이 없어 그대로 사라진다 — 첫 클릭이 삼켜지는 창이다.
  const readyRef = useRef(false);
  const playingRef = useRef(false);
  const advanceRef = useRef<() => void>(() => {});
  // 위젯이 지금 세트를 들고 있는가. 들고 있으면 전환이 skip으로 끝나 새 재생을 시작하지 않는다
  // — 백그라운드 자동 전환의 조건이다. 세트 밖 곡을 load하면 세트를 잃고 false가 된다.
  const holdsSetRef = useRef(false);
  // id를 아직 모르는 자리는 null로 남긴다 — 빼버리면 그 뒤가 한 칸씩 밀려 skip이 엉뚱한 곡으로 간다.
  const soundIdsRef = useRef<(number | null)[]>([]);
  // 위젯이 지금 물고 있는 트랙. 딥링크로 들어오면 화면은 그 곡인데 위젯은 세트의 첫 곡을 물고 있어서
  // 그냥 play를 부르면 첫 곡이 난다 — 재개 전에 같은 곡인지 본다.
  const heldIndexRef = useRef(-1);
  // 다음 재생을 0에서 시작해야 하는가. 위젯은 세트 안 각 곡의 위치를 물고 있어서
  // 곡을 바꿔도 듣던 지점부터 난다 — 곡이 바뀔 때만 세우고 play 시점에 되감는다.
  // 일시정지 후 재생이나 스크럽 후 재생은 세우지 않으므로 그 위치를 지킨다.
  const shouldRewindRef = useRef(false);
  // play 직후 보낸 seekTo는 곧이어 위젯이 그 곡의 기억해 둔 위치로 덮어쓸 때가 있다(실측: 0을 한 번 보고한 뒤 ~20ms 만에 87초로).
  // 되감은 뒤 잠시 progress를 지켜보고, 기억된 위치로 튀면 다시 되감는다.
  const pendingRewindRef = useRef<PendingRewind | null>(null);
  const pauseAfterSwitchRef = useRef(false);
  const resumeRef = useRef<{ index: number; ms: number } | null>(null);
  // 전환 요청의 세대. 위젯 콜백은 postMessage 왕복이라 빠른 연속 선택 시 낡은 응답이 늦게 도착한다
  // — 그대로 두면 나중에 온 이전 곡의 skip이 이겨서 "누른 곡이 아니라 아까 곡"이 난다.
  const goSeqRef = useRef(0);
  const queuedRef = useRef<number | null>(null);
  const flushQueuedRef = useRef<() => void>(() => {});

  return {
    widgetRef,
    readyRef,
    playingRef,
    advanceRef,
    holdsSetRef,
    soundIdsRef,
    heldIndexRef,
    shouldRewindRef,
    pendingRewindRef,
    pauseAfterSwitchRef,
    resumeRef,
    goSeqRef,
    queuedRef,
    flushQueuedRef,
  };
}
