import { BLOCK_SIZE, BOARD_SIZE } from '@entities/sudoku/config/board';
import { GAME_MODE } from '@entities/sudoku/config/game';
import { cellAt } from '@entities/sudoku/lib/gridAccess';
import {
  checkConflicts,
  isBoardComplete,
  isKillerBoardComplete,
  markWrongValues,
  validateKillerCages,
} from '@entities/sudoku/lib/validator';
import type { CellHighlight, Grid, SudokuBoard, SudokuCell } from '@entities/sudoku/model/types/board';
import type { GameCompletionResult, GameMode, KillerCage } from '@entities/sudoku/model/types/game';

export function updateSingleCell(
  board: SudokuBoard,
  row: number,
  col: number,
  updates: Partial<SudokuCell>,
): SudokuBoard {
  return board.map((r, rIdx) =>
    rIdx === row ? r.map((cell, cIdx) => (cIdx === col ? { ...cell, ...updates } : cell)) : r,
  );
}

export function updateCellSelection(board: SudokuBoard, selectedRow: number, selectedCol: number): SudokuBoard {
  let hasChanges = false;

  const nextBoard = board.map((row, rowIndex) => {
    let rowChanged = false;

    const nextRow = row.map((cell, colIndex) => {
      const shouldSelect = rowIndex === selectedRow && colIndex === selectedCol;

      if (cell.isSelected === shouldSelect) {
        return cell;
      }

      rowChanged = true;
      hasChanges = true;

      return {
        ...cell,
        isSelected: shouldSelect,
      };
    });

    return rowChanged ? nextRow : row;
  });

  return hasChanges ? nextBoard : board;
}

const NO_CELL = -1;

export const clearCellSelection = (board: SudokuBoard): SudokuBoard => updateCellSelection(board, NO_CELL, NO_CELL);

export function updateCellNotes(board: SudokuBoard, row: number, col: number, notes: number[]): SudokuBoard {
  return updateSingleCell(board, row, col, { notes: [...notes] });
}

export function resetUserInputs(board: SudokuBoard): SudokuBoard {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isInitial) {
        return { ...cell, isSelected: false, isConflict: false };
      }
      return {
        ...cell,
        value: null,
        notes: [],
        isConflict: false,
        isSelected: false,
        isHint: false,
      };
    }),
  );
}

interface HighlightSelection {
  row: number;
  col: number;
  value: number | null;
}

function isRelatedCell(r: number, c: number, { row, col }: HighlightSelection): boolean {
  if (r === row || c === col) return true;
  return (
    Math.floor(r / BLOCK_SIZE) === Math.floor(row / BLOCK_SIZE) &&
    Math.floor(c / BLOCK_SIZE) === Math.floor(col / BLOCK_SIZE)
  );
}

function highlightOf(board: SudokuBoard, r: number, c: number, selection: HighlightSelection): CellHighlight {
  const isSelected = r === selection.row && c === selection.col;
  return {
    selected: isSelected,
    related: !isSelected && isRelatedCell(r, c, selection),
    sameValue: !isSelected && selection.value !== null && cellAt(board, r, c).value === selection.value,
  };
}

function isSameHighlight(previous: CellHighlight | undefined, next: CellHighlight): previous is CellHighlight {
  return (
    previous !== undefined &&
    previous.selected === next.selected &&
    previous.related === next.related &&
    previous.sameValue === next.sameValue
  );
}

export function calculateHighlights(
  board: SudokuBoard,
  row: number,
  col: number,
  previousHighlights?: Record<string, CellHighlight>,
): Record<string, CellHighlight> {
  const selection: HighlightSelection = { row, col, value: cellAt(board, row, col).value };
  const nextHighlights: Record<string, CellHighlight> = {};

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r}-${c}`;
      const previous = previousHighlights?.[key];
      const next = highlightOf(board, r, c, selection);
      nextHighlights[key] = isSameHighlight(previous, next) ? previous : next;
    }
  }

  return nextHighlights;
}

export function clearHighlights(previousHighlights?: Record<string, CellHighlight>) {
  const nextHighlights: Record<string, CellHighlight> = {};

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r}-${c}`;
      const prevHighlight = previousHighlights?.[key];

      if (prevHighlight && !prevHighlight.selected && !prevHighlight.related && !prevHighlight.sameValue) {
        nextHighlights[key] = prevHighlight;
      } else {
        nextHighlights[key] = {
          selected: false,
          related: false,
          sameValue: false,
        };
      }
    }
  }

  return nextHighlights;
}

export function canFillCell(selectedCell: { row: number; col: number } | null, board: SudokuBoard): boolean {
  if (!selectedCell) return false;

  const { row, col } = selectedCell;
  return !cellAt(board, row, col).isInitial;
}

export function updateCellValue(board: SudokuBoard, row: number, col: number, value: number | null): SudokuBoard {
  return updateSingleCell(board, row, col, {
    value,
    notes: [],
  });
}

export function validateBoard(
  board: SudokuBoard,
  solution: Grid,
  gameMode: GameMode,
  cages: KillerCage[],
): SudokuBoard {
  const ruleChecked = gameMode === GAME_MODE.KILLER ? validateKillerCages(board, cages) : checkConflicts(board);
  return markWrongValues(ruleChecked, solution);
}

/**
 * @description 게임 완료 상태 확인 — validateBoard를 거친 보드여야 한다(충돌 표시가 정답 판정의 근거).
 * @param {SudokuBoard} board - 충돌 검사된 보드
 * @param {GameMode} gameMode - 게임 모드
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {GameCompletionResult} 게임 완료 결과
 */
export function checkGameCompletion(board: SudokuBoard, gameMode: GameMode, cages: KillerCage[]): GameCompletionResult {
  const completed = gameMode === GAME_MODE.KILLER ? isKillerBoardComplete(board, cages) : isBoardComplete(board);

  return { completed, success: completed, board };
}
