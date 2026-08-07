import { MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import { MarkGrid, StardokuPuzzle } from '@entities/stardoku/model/types';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// ── 영속 atoms (localStorage) ──────────────────────────────

export const stageAtom = atomWithStorage<number>('stardoku:stage', 1);
export const puzzleAtom = atomWithStorage<StardokuPuzzle | null>('stardoku:puzzle', null);
export const marksAtom = atomWithStorage<MarkGrid>('stardoku:marks', []);
export const livesAtom = atomWithStorage<number>('stardoku:lives', MAX_LIVES);
export const hintsRemainingAtom = atomWithStorage<number>('stardoku:hints', MAX_HINTS);
/** 누적 점수 — 랭킹의 기반. 게임 오버 감점으로 음수도 가능 */
export const scoreAtom = atomWithStorage<number>('stardoku:score', 0);

// ── 비영속 atoms ───────────────────────────────────────────

/** 방금 탭으로 놓은 ✕ — 연속 탭이면 별로 승격 */
export const lastXTapAtom = atom<{ row: number; col: number; time: number } | null>(null);
