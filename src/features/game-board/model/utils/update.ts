import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Position, SudokuBoard } from "@entities/board/model/types";
import { CellHighlight, SudokuCell } from "@entities/cell/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { GameCompletionResult, GameMode, KillerCage } from "@entities/game/model/types";
import {
  checkConflicts,
  createEmptyHighlights,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  validateKillerCages,
} from "@features/game-board/model/utils";

/**
 * @description 단일 셀만 업데이트 (가장 효율적)
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
  return board.map((r, rIdx) =>
    r.map((cell, cIdx) => ({
      ...cell,
      isSelected: rIdx === selectedRow && cIdx === selectedCol,
    })),
  );
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
function markRelatedCells(highlights: Record<string, CellHighlight>, row: number, col: number, selectedKey: string) {
  // 같은 행
  for (let c = 0; c < BOARD_SIZE; c++) {
    const key = `${row}-${c}`;
    if (key !== selectedKey) {
      highlights[key].related = true;
    }
  }

  // 같은 열
  for (let r = 0; r < BOARD_SIZE; r++) {
    const key = `${r}-${col}`;
    if (key !== selectedKey) {
      highlights[key].related = true;
    }
  }

  // 같은 3x3 블록
  const blockStartRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockStartCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;

  for (let r = blockStartRow; r < blockStartRow + BLOCK_SIZE; r++) {
    for (let c = blockStartCol; c < blockStartCol + BLOCK_SIZE; c++) {
      const key = `${r}-${c}`;
      if (key !== selectedKey) {
        highlights[key].related = true;
      }
    }
  }
}

/**
 * @description 같은 값을 가진 셀들을 sameValue로 마킹
 * @param {Record<string, CellHighlight>} highlights - 하이라이트 객체
 * @param {SudokuBoard} board - 보드
 * @param {number} selectedValue - 선택된 값
 * @param {string} selectedKey - 선택된 셀 키
 */
function markSameValueCells(
  highlights: Record<string, CellHighlight>,
  board: SudokuBoard,
  selectedValue: number,
  selectedKey: string,
) {
  if (selectedValue === null) return;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r}-${c}`;
      if (key !== selectedKey && board[r][c].value === selectedValue) {
        highlights[key].sameValue = true;
      }
    }
  }
}

/**
 * @description 선택된 셀 기준으로 하이라이트 상태를 계산합니다
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {number} row - 선택된 행
 * @param {number} col - 선택된 열
 * @returns {Record<string, CellHighlight>} 계산된 하이라이트 객체
 */
export function calculateHighlights(board: SudokuBoard, row: number, col: number) {
  const newHighlights = createEmptyHighlights();
  const selectedValue = board[row][col].value;
  const selectedKey = `${row}-${col}`;

  // 1. 선택된 셀 표시
  newHighlights[selectedKey].selected = true;

  // 2. 관련 셀들 표시 (행, 열, 블록)
  markRelatedCells(newHighlights, row, col, selectedKey);

  // 3. 같은 값을 가진 셀들 표시
  if (selectedValue !== null) {
    markSameValueCells(newHighlights, board, selectedValue, selectedKey);
  }

  return newHighlights;
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
