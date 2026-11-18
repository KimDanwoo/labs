export const ARTWORK_TEXTURE_SIZE = 't500x500';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const RIPPLE_MS = 900;

/**
 * 비트 파동은 클릭보다 짧고 약하다. 킥 간격이 실측 평균 538ms인데 클릭 수명(900ms)을 그대로 주면
 * 파면이 겹쳐 그림이 계속 일렁이고, 진폭도 클릭과 같으면 아트워크가 안 읽힌다.
 * 세기에 비례해 이 값까지 쓴다. 상한은 0.7 — 2D 야코비안으로 재보니 무작위 원점 + 클릭 동시에
 * 최소 고유값이 0.42에서 +0.29, 0.7에서 +0.165, 1.0에서 -0.145(접힘)였다. 여유 16%를 남긴 값이다.
 */
export const BEAT_RIPPLE = { ms: 480, amp: 0.7, spread: 0.62 } as const;

export const CLICK_RIPPLE_AMP = 1;

export const FRAME = { referenceMs: 16.7, maxStep: 3, minSpeedStep: 0.2 } as const;

export const MORPH = { initial: 0.001, inRate: 0.038, outRate: 0.075, swapThreshold: 0.02 } as const;

export const TRAIL = { speedGain: 140, ease: 0.14 } as const;

export const DECAY = { max: 0.88, trail: 0.86, energy: 0.24 } as const;
