import { PLAYER_SCREEN, REPEAT_MODE, type PlayerScreen, type RepeatMode } from '@entities/track/model/constants';
import { atom } from 'jotai';

export const currentIndexAtom = atom(0);
export const isPlayingAtom = atom(false);
export const isReadyAtom = atom(false);
export const shuffleAtom = atom(false);
export const repeatModeAtom = atom<RepeatMode>(REPEAT_MODE.off);

/** 재생 엔진 로드 실패는 콘솔이 아니라 화면에 드러낸다. */
export const engineErrorAtom = atom<string | null>(null);

/**
 * 어떤 화면인가 — 진실은 주소창이고 이 원자는 그걸 읽는 창구다(useTrackUrl이 양방향으로 맞춘다).
 * 전환은 pushState로 한다. Next 라우터를 타면 트리가 리마운트되고, 그러면 재생 엔진 iframe이 사라진다.
 */
export const playerScreenAtom = atom<PlayerScreen>(PLAYER_SCREEN.nowPlaying);

/** 'set' = 곡 전체를 한 번에 올려 skip으로 전환(빠름), 'single' = 곡별 load 폴백(느림). */
export const engineModeAtom = atom<'set' | 'single' | 'unknown'>('unknown');

/**
 * 매 프레임 변하는 값은 atom에 두지 않는다. 60fps 리렌더 비용이 렌더링 예산을 먹는다.
 * rAF 루프가 쓰고, 캔버스·transport·레벨미터가 같은 루프 안에서 읽는다.
 */
export const frameState = {
  /** 0–1 */
  position: 0,
  /** 0–1, 곡별 백분위로 재매핑한 진폭. 파티클 호흡·진행 헤드 글로우·레벨미터. */
  level: 0,
  /** 0–1, 프레이즈 단위 에너지(4초 이동평균). 블룸량과 휘도 깊이를 느리게 밀어올린다. */
  swell: 0,
  /**
   * 저역(킥·베이스)과 고역(하이햇·공기감). 원곡 분석 신호가 있는 곡에서만 움직인다 —
   * 사클 파형은 진폭 하나뿐이라 대역을 나눌 수 없다.
   */
  bass: 0,
  air: 0,
  /**
   * 비트 사건. 값이 아니라 사건이라 카운터로 흘린다 — 구독 순서에 상관없이 놓치지 않는다
   * (rAF 한 루프 안에서 파형 훅이 쓰고 무대가 읽는데, 효과 실행 순서는 자식이 먼저다).
   */
  beatId: 0,
  /** 마지막 비트의 세기 0–1. */
  beatStrength: 0,
  /** 0–1, 다가오는 피크 직전의 들이쉼. 파티클이 살짝 수축한다. */
  pre: 0,
  /** 0–1, 피크 직후의 릴리스. 블룸이 터지고 점이 커진다. */
  hit: 0,
  /** 0–1, 위젯이 버퍼링한 구간. 진행바 뒤에 옅게 깔린다. */
  buffered: 0,
  durationMs: 0,
};
