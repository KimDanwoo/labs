import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Position, SudokuBoard } from "@entities/board/model/types";
import { CellHighlight, SudokuCell } from "@entities/cell/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { GameCompletionResult, GameMode, KillerCage } from "@entities/game/model/types";
import {
  checkConflicts,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  validateKillerCages,
} from "@features/game-board/model/utils";

/**
 * @description 단일 셀만 업데이트
 * @param {SudokuBoard} board - 업데이트할 보드
 * @param {number} row - 업데이트할 행
 * @param {number} col - 업데이트할 열
 * @param {Partial<SudokuCell>} updates - 업데이트할 셀 정보
 * @returns
 */
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

/**
 * @description 셀 선택 상태 업데이트 (자주 사용되는 패턴)
 * @param {SudokuBoard} board - 업데이트할 보드
 * @param {number} selectedRow - 선택된 행
 * @param {number} selectedCol - 선택된 열
 * @returns
 */
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

/**
 * @description 노트만 업데이트
 * @param {SudokuBoard} board - 업데이트할 보드
 * @param {number} row - 업데이트할 행
 * @param {number} col - 업데이트할 열
 * @param {number[]} notes - 업데이트할 노트
 * @returns
 */
export function updateCellNotes(board: SudokuBoard, row: number, col: number, notes: number[]): SudokuBoard {
  return updateSingleCell(board, row, col, { notes: [...notes] });
}

/**
 * @description 사용자 입력 초기화 (초기 셀은 유지)
 * @param {SudokuBoard} board - 업데이트할 보드
 * @returns
 */
export function resetUserInputs(board: SudokuBoard): SudokuBoard {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isInitial) {
        // 초기 셀은 선택/충돌 상태만 리셋
        return { ...cell, isSelected: false, isConflict: false };
      }
      // 사용자 입력 셀은 값과 노트 제거
      return {
        ...cell,
        value: null,
        notes: [],
        isConflict: false,
        isSelected: false,
      };
    }),
  );
}

/**
 * @description 빈 셀 찾기
 * @param {SudokuBoard} board - 보드
 * @returns {Position[]} 빈 셀 배열
 */
export function findEmptyCells(board: SudokuBoard): Position[] {
  const emptyCells: Position[] = board.flatMap((row, rowIndex) =>
    row.reduce<Position[]>((acc, cell, colIndex) => {
      if (cell.value === null) {
        acc.push({ row: rowIndex, col: colIndex });
      }
      return acc;
    }, []),
  );

  return emptyCells;
}

/**
 * @description 같은 행, 열, 블록의 셀들을 related로 마킹
 * @param {Record<string, CellHighlight>} highlights - 하이라이트 객체
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {string} selectedKey - 선택된 셀 키
 */
/**
 * @description 선택된 셀 기준으로 하이라이트 상태를 계산합니다
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {number} row - 선택된 행
 * @param {number} col - 선택된 열
 * @param {Record<string, CellHighlight>} previousHighlights - 이전 하이라이트 맵
 * @returns {Record<string, CellHighlight>} 계산된 하이라이트 객체
 */
export function calculateHighlights(
  board: SudokuBoard,
  row: number,
  col: number,
  previousHighlights?: Record<string, CellHighlight>,
): Record<string, CellHighlight> {
  const selectedKey = `${row}-${col}`;
  const selectedValue = board[row][col].value;
  const blockRow = Math.floor(row / BLOCK_SIZE);
  const blockCol = Math.floor(col / BLOCK_SIZE);

  const nextHighlights: Record<string, CellHighlight> = {};

  for (let r = 0; r < BOARD_SIZE; r++) {
    const currentBlockRow = Math.floor(r / BLOCK_SIZE);

    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r}-${c}`;
      const prevHighlight = previousHighlights?.[key];

      const isSelected = key === selectedKey;
      const isRelated =
        !isSelected &&
        (r === row ||
          c === col ||
          (currentBlockRow === blockRow && Math.floor(c / BLOCK_SIZE) === blockCol));
      const hasSameValue =
        !isSelected && selectedValue !== null && board[r][c].value === selectedValue;

      if (
        prevHighlight &&
        prevHighlight.selected === isSelected &&
        prevHighlight.related === isRelated &&
        prevHighlight.sameValue === hasSameValue
      ) {
        nextHighlights[key] = prevHighlight;
      } else {
        nextHighlights[key] = {
          selected: isSelected,
          related: isRelated,
          sameValue: hasSameValue,
        };
      }
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

/**
 * @description 셀에 값을 입력할 수 있는지 검증
 * @param {Position} selectedCell - 선택된 셀
 * @param {SudokuBoard} board - 보드
 * @returns {boolean} 셀에 값을 입력할 수 있는지 여부
 */
export function canFillCell(selectedCell: { row: number; col: number } | null, board: SudokuBoard): boolean {
  if (!selectedCell) return false;

  const { row, col } = selectedCell;
  return !board[row][col].isInitial;
}

/**
 * @description 보드에 값을 입력하고 새로운 보드 반환
 * @param {SudokuBoard} board - 보드
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {number | null} value - 입력할 값
 * @returns {SudokuBoard} 업데이트된 보드
 */
export function updateCellValue(board: SudokuBoard, row: number, col: number, value: number | null): SudokuBoard {
  return updateSingleCell(board, row, col, {
    value,
    notes: [],
  });
}

/**
 * @description 게임 모드에 따른 충돌 검사
 * @param {SudokuBoard} board - 보드
 * @param {GameMode} gameMode - 게임 모드
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {SudokuBoard} 충돌 검사된 보드
 */
export function validateBoard(board: SudokuBoard, gameMode: GameMode, cages: KillerCage[]): SudokuBoard {
  if (gameMode === GAME_MODE.KILLER) {
    return validateKillerCages(board, cages);
  }
  return checkConflicts(board);
}

/**
 * @description 게임 완료 상태 확인
 * @param {SudokuBoard} board - 보드
 * @param {number[][]} solution - 솔루션
 * @param {GameMode} gameMode - 게임 모드
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {GameCompletionResult} 게임 완료 결과
 */
export function checkGameCompletion(
  board: SudokuBoard,
  solution: number[][],
  gameMode: GameMode,
  cages: KillerCage[],
): GameCompletionResult {
  let completed = false;

  if (gameMode === GAME_MODE.KILLER) {
    completed = isKillerBoardComplete(board, cages);
  } else {
    completed = isBoardComplete(board);
  }

  const success = completed && isBoardCorrect(board, solution);

  return {
    completed,
    success,
    board,
  };
}
