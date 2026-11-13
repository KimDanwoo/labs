import { MINUTE } from '@shared/config/time';
import { atIndex } from '../../lib/gridAccess';
import { BOARD_SIZE } from '../constants/board';
import type { CellHighlight, Grid, SudokuBoard } from '../types/board';

export function createEmptyGrid(): Grid {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(0));
}

export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [atIndex(array, j), atIndex(array, i)];
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / MINUTE);
  const secs = seconds % MINUTE;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function createEmptyBoard(): SudokuBoard {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() =>
      Array(BOARD_SIZE)
        .fill(null)
        .map(() => ({
          value: null,
          isInitial: false,
          isSelected: false,
          isConflict: false,
          isHint: false,
          notes: [],
        })),
    );
}

export function createEmptyHighlights(): Record<string, CellHighlight> {
  const highlights: Record<string, CellHighlight> = {};

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row}-${col}`;
      highlights[key] = {
        selected: false,
        related: false,
        sameValue: false,
      };
    }
  }

  return highlights;
}
