import { atom } from 'jotai';
import { REPEAT_MODE, type RepeatMode } from '../constants/repeatMode';

export const currentIndexAtom = atom(0);
export const isPlayingAtom = atom(false);
export const isReadyAtom = atom(false);
export const shuffleAtom = atom(false);
export const repeatModeAtom = atom<RepeatMode>(REPEAT_MODE.off);

/** 재생 엔진 로드 실패는 콘솔이 아니라 화면에 드러낸다. */
export const engineErrorAtom = atom<string | null>(null);

/** 'set' = 24곡을 한 번에 올려 skip으로 전환(빠름), 'single' = 곡별 load 폴백(느림). */
export const engineModeAtom = atom<'set' | 'single' | 'unknown'>('unknown');

/**
 * 매 프레임 변하는 값은 atom에 두지 않는다. 60fps 리렌더 비용이 렌더링 예산을 먹는다.
 * rAF 루프가 쓰고, 캔버스·transport·레벨미터가 같은 루프 안에서 읽는다.
 */
export const frameState = {
  /** 0–1 */
  position: 0,
  /** 0–1, 파형 진폭 */
  level: 0,
  durationMs: 0,
};
