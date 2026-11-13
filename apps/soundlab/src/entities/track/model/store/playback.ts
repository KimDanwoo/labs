import { atom } from 'jotai/vanilla';
import { type PlayerScreen, PLAYER_SCREEN } from '../constants/playerScreen';
import { type RepeatMode, REPEAT_MODE } from '../constants/repeatMode';
import type { PlaybackQueue } from '../queue';

export const playbackQueueAtom = atom<PlaybackQueue | null>(null);
export const recoveryNoticeAtom = atom(false);
export const resumeNoticeAtom = atom<number | null>(null);

export const currentIndexAtom = atom(0);
export const isPlayingAtom = atom(false);
export const isReadyAtom = atom(false);
export const shuffleAtom = atom(false);
export const repeatModeAtom = atom<RepeatMode>(REPEAT_MODE.off);

export const engineErrorAtom = atom<string | null>(null);

/**
 * 어떤 화면인가 — 진실은 주소창이고 이 원자는 그걸 읽는 창구다(useTrackUrl이 양방향으로 맞춘다).
 * 전환은 pushState로 한다. Next 라우터를 타면 트리가 리마운트되고, 그러면 재생 엔진 iframe이 사라진다.
 */
export const playerScreenAtom = atom<PlayerScreen>(PLAYER_SCREEN.nowPlaying);

export const engineModeAtom = atom<'set' | 'single' | 'unknown'>('unknown');

/**
 * 매 프레임 변하는 값은 atom에 두지 않는다. 60fps 리렌더 비용이 렌더링 예산을 먹는다.
 * rAF 루프가 쓰고, 캔버스·transport·레벨미터가 같은 루프 안에서 읽는다.
 */
export const frameState = {
  position: 0,
  level: 0,
  swell: 0,
  bass: 0,
  air: 0,
  /**
   * 비트 사건. 값이 아니라 사건이라 카운터로 흘린다 — 구독 순서에 상관없이 놓치지 않는다
   * (rAF 한 루프 안에서 파형 훅이 쓰고 무대가 읽는데, 효과 실행 순서는 자식이 먼저다).
   */
  beatId: 0,
  beatStrength: 0,
  pre: 0,
  hit: 0,
  buffered: 0,
  durationMs: 0,
};
