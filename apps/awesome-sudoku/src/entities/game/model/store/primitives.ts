import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { NUMBER_COUNTS } from '../constants/board';
import { GAME_LEVEL, GAME_MODE, HINTS_REMAINING } from '../constants/game';
import { createEmptyBoard, createEmptyGrid, createEmptyHighlights } from '../services/common';
import type { CellHighlight, Position, SudokuCell } from '../types/board';
import type { Difficulty, GameMode, KillerCage } from '../types/game';

export const boardAtom = atomWithStorage<SudokuCell[][]>('sudoku:board', createEmptyBoard());
export const solutionAtom = atomWithStorage<number[][]>('sudoku:solution', createEmptyGrid());
export const selectedCellAtom = atomWithStorage<Position | null>('sudoku:selectedCell', null);
export const isCompletedAtom = atomWithStorage<boolean>('sudoku:isCompleted', false);
export const isSuccessAtom = atomWithStorage<boolean>('sudoku:isSuccess', false);
export const isRecordSavedAtom = atomWithStorage<boolean>('sudoku:isRecordSaved', false);
export const currentTimeAtom = atomWithStorage<number>('sudoku:currentTime', 0);
export const timerActiveAtom = atomWithStorage<boolean>('sudoku:timerActive', false);
export const difficultyAtom = atomWithStorage<Difficulty>('sudoku:difficulty', GAME_LEVEL.MEDIUM);
export const numberCountsAtom = atomWithStorage<Record<number, number>>('sudoku:numberCounts', NUMBER_COUNTS);
export const hintsRemainingAtom = atomWithStorage<number>('sudoku:hintsRemaining', HINTS_REMAINING);
export const mistakeCountAtom = atomWithStorage<number>('sudoku:mistakeCount', 0);
export const gameModeAtom = atomWithStorage<GameMode>('sudoku:gameMode', GAME_MODE.CLASSIC);
export const cagesAtom = atomWithStorage<KillerCage[]>('sudoku:cages', []);

export const isNoteModeAtom = atom(false);
export const isGeneratingAtom = atom(false);
export const highlightedCellsAtom = atom<Record<string, CellHighlight>>(createEmptyHighlights());
