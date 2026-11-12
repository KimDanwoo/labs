import { atom } from 'jotai';

export const VISUAL_MODE = { auto: 'auto', calm: 'calm', still: 'still' } as const;
export type VisualMode = (typeof VISUAL_MODE)[keyof typeof VISUAL_MODE];
export const visualModeAtom = atom<VisualMode>(VISUAL_MODE.auto);
export const VISUAL_LABEL = { auto: '음악 반응', calm: '효과 줄이기', still: '정지 이미지' } satisfies Record<
  VisualMode,
  string
>;
export function isVisualMode(value: string): value is VisualMode {
  return Object.values(VISUAL_MODE).some((mode) => mode === value);
}
