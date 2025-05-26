import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Position, SudokuBoard } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { GameMode, KillerCage } from "@entities/game/model/types";
import { createEmptyHighlights } from "@features/game-board/model/utils/common";
import { checkKillerConflicts, isKillerBoardComplete } from "@features/game-board/model/utils/killer";
import { checkConflicts, isBoardComplete, isBoardCorrect } from "@features/game-board/model/utils/validator";

/**
 * @description 빈 셀 찾기
 * @param board
 * @returns
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
 * @description  사용자 입력 초기화
 * @param board
 * @returns
 */
export function resetInitialBoard(board: SudokuBoard): SudokuBoard {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isInitial) {
        return cell;
      }
      return { ...cell, value: null, notes: [], isConflict: false, isSelected: false };
    }),
  );
}

/**
 * @description 셀 선택
 * @param board
 * @param row
 * @param col
 * @returns
 */
export function selectBoardCell(board: SudokuBoard, row: number, col: number): SudokuBoard {
  return board.map((r, rowIdx) =>
    r.map((cell, colIdx) => ({
      ...cell,
      isSelected: rowIdx === row && colIdx === col,
    })),
  );
}

/**
 * @description 선택된 셀 기준으로 하이라이트 상태를 계산합니다
 * @param board 현재 스도쿠 보드
 * @param row 선택된 행
 * @param col 선택된 열
 * @returns 계산된 하이라이트 객체
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
 * @description 같은 행, 열, 블록의 셀들을 related로 마킹
 */
function markRelatedCells(highlights: any, row: number, col: number, selectedKey: string) {
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
 * @param highlights
 * @param board
 * @param selectedValue
 * @param selectedKey
 */
function markSameValueCells(highlights: any, board: SudokuBoard, selectedValue: number, selectedKey: string) {
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
 * @description 셀에 값을 입력할 수 있는지 검증
 * @param selectedCell
 * @param board
 * @returns
 */
export function canFillCell(selectedCell: { row: number; col: number } | null, board: SudokuBoard): boolean {
  if (!selectedCell) return false;

  const { row, col } = selectedCell;
  return !board[row][col].isInitial;
}

/**
 * @description 보드에 값을 입력하고 새로운 보드 반환
 * @param board
 * @param position
 * @param value
 * @returns
 */
export function updateCellValue(
  board: SudokuBoard,
  position: { row: number; col: number },
  value: number | null,
): SudokuBoard {
  const newBoard = structuredClone(board) as SudokuBoard;
  const { row, col } = position;

  newBoard[row][col].value = value;
  newBoard[row][col].notes = []; // 값을 입력하면 노트 제거

  return newBoard;
}

/**
 * @description 게임 모드에 따른 충돌 검사
 * @param board
 * @param gameMode
 * @param cages
 * @returns
 */
export function validateBoard(board: SudokuBoard, gameMode: GameMode, cages: KillerCage[]): SudokuBoard {
  if (gameMode === GAME_MODE.KILLER) {
    return checkKillerConflicts(board, cages);
  }
  return checkConflicts(board);
}

/**
 * @description 게임 완료 상태 확인
 * @param board
 * @param solution
 * @param gameMode
 * @param cages
 * @returns
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

export interface GameCompletionResult {
  completed: boolean;
  success: boolean;
  board: SudokuBoard;
}
