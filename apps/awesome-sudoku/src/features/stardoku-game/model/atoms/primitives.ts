import { MAX_HINTS, MAX_LIVES } from '@entities/stardoku/model/constants';
import type { MarkGrid, StardokuPuzzle } from '@entities/stardoku/model/types';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// ── 영속 atoms (localStorage) ──────────────────────────────

/**
 * 저장 키 버전. 판 크기 커브·판정 규칙·구역 생성이 바뀌면 올린다 —
 * 옛 저장분은 지금 규칙과 안 맞는 퍼즐이라 이어받으면 안 된다. 키가 바뀌면 기존 값은 그대로 버려진다.
 */
const STORAGE_PREFIX = 'stardoku:v2';

export const stageAtom = atomWithStorage<number>(`${STORAGE_PREFIX}:stage`, 1);
export const puzzleAtom = atomWithStorage<StardokuPuzzle | null>(`${STORAGE_PREFIX}:puzzle`, null);
export const marksAtom = atomWithStorage<MarkGrid>(`${STORAGE_PREFIX}:marks`, []);
export const livesAtom = atomWithStorage<number>(`${STORAGE_PREFIX}:lives`, MAX_LIVES);
export const hintsRemainingAtom = atomWithStorage<number>(`${STORAGE_PREFIX}:hints`, MAX_HINTS);
/** 누적 점수 — 랭킹의 기반. 게임 오버 감점으로 음수도 가능 */
export const scoreAtom = atomWithStorage<number>(`${STORAGE_PREFIX}:score`, 0);

// ── 비영속 atoms ───────────────────────────────────────────

/** 방금 탭으로 놓은 ✕ — 연속 탭이면 별로 승격 */
export const lastXTapAtom = atom<{ row: number; col: number; time: number } | null>(null);
