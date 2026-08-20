/** 버튼을 누를 때마다 off → all → one → off 로 순환한다. */
export const REPEAT_MODE = {
  off: 'off',
  all: 'all',
  one: 'one',
} as const;

export type RepeatMode = keyof typeof REPEAT_MODE;

const CYCLE: readonly RepeatMode[] = [REPEAT_MODE.off, REPEAT_MODE.all, REPEAT_MODE.one];

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
  return next ?? REPEAT_MODE.off;
}

export const REPEAT_LABEL: Record<RepeatMode, string> = {
  [REPEAT_MODE.off]: '반복 없음',
  [REPEAT_MODE.all]: '전체 반복',
  [REPEAT_MODE.one]: '한곡 반복',
};
