import { BLOCKS_PER_ROW, BLOCK_SIZE, BOARD_SIZE } from '@entities/board/model/constants';
import type { Grid, SudokuBoard } from '@entities/board/model/types';
import type { KillerCage } from '@entities/game/model/types';
import { getBlockNumbers, getColumnNumbers, getRowNumbers, isValidNumberSet } from '@entities/game/model/utils';

/**
 * @description 완성 그리드가 스도쿠 규칙(행·열·블록에 1~9가 한 번씩)을 만족하는지 검사
 */
export function isValidSolution(grid: Grid): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (!isValidNumberSet(getRowNumbers(grid, i)) || !isValidNumberSet(getColumnNumbers(grid, i))) return false;
  }
  for (let blockRow = 0; blockRow < BLOCKS_PER_ROW; blockRow++) {
    for (let blockCol = 0; blockCol < BLOCKS_PER_ROW; blockCol++) {
      if (!isValidNumberSet(getBlockNumbers(grid, blockRow, blockCol))) return false;
    }
  }
  return true;
}

/**
 * @description 사용자가 채운 값이 정답과 다르면 충돌로 표시한다. 퍼즐은 유일해라 정답과 다른 값은 반드시 오답이다.
 */
export function markWrongValues(board: SudokuBoard, solution: Grid): SudokuBoard {
  return board.map((row, r) =>
    row.map((cell, c) => {
      const isWrong = !cell.isInitial && cell.value !== null && cell.value !== solution[r][c];
      return isWrong && !cell.isConflict ? { ...cell, isConflict: true } : cell;
    }),
  );
}

/**
 * @description 스도쿠 보드의 충돌 확인 및 표시
 * @description 행, 열, 3x3 블록 규칙 검증
 * @param {SudokuBoard} board - 검사할 스도쿠 보드
 * @returns {SudokuBoard} 충돌 정보가 업데이트된 보드
 */
export function checkConflicts(board: SudokuBoard): SudokuBoard {
  const newBoard = structuredClone(board);

  // 각 행, 열, 블록별로 중복 검사를 한 번에 처리
  const conflicts = new Set<string>();

  // 행별 중복 검사
  for (let row = 0; row < BOARD_SIZE; row++) {
    const seen = new Map<number, number[]>();
    for (let col = 0; col < BOARD_SIZE; col++) {
      const value = newBoard[row][col].value;
      if (value !== null) {
        if (!seen.has(value)) {
          seen.set(value, []);
        }
        seen.get(value)!.push(col);
      }
    }

    // 중복된 값들의 위치를 conflicts에 추가
    for (const [, positions] of seen) {
      if (positions.length > 1) {
        positions.forEach((col) => conflicts.add(`${row}-${col}`));
      }
    }
  }

  // 열별 중복 검사
  for (let col = 0; col < BOARD_SIZE; col++) {
    const seen = new Map<number, number[]>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      const value = newBoard[row][col].value;
      if (value !== null) {
        if (!seen.has(value)) {
          seen.set(value, []);
        }
        seen.get(value)!.push(row);
      }
    }

    for (const [, positions] of seen) {
      if (positions.length > 1) {
        positions.forEach((row) => conflicts.add(`${row}-${col}`));
      }
    }
  }

  // 3x3 블록별 중복 검사
  for (let blockRow = 0; blockRow < BLOCKS_PER_ROW; blockRow++) {
    for (let blockCol = 0; blockCol < BLOCKS_PER_ROW; blockCol++) {
      const seen = new Map<number, Array<[number, number]>>();

      for (let r = 0; r < BLOCK_SIZE; r++) {
        for (let c = 0; c < BLOCK_SIZE; c++) {
          const row = blockRow * BLOCK_SIZE + r;
          const col = blockCol * BLOCK_SIZE + c;
          const value = newBoard[row][col].value;

          if (value !== null) {
            if (!seen.has(value)) {
              seen.set(value, []);
            }
            seen.get(value)!.push([row, col]);
          }
        }
      }

      for (const [, positions] of seen) {
        if (positions.length > 1) {
          positions.forEach(([row, col]) => conflicts.add(`${row}-${col}`));
        }
      }
    }
  }

  // 충돌 정보를 보드에 반영
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      newBoard[row][col].isConflict = conflicts.has(`${row}-${col}`);
    }
  }

  return newBoard;
}

/**
 * @description 스도쿠 보드가 완성되었는지 확인
 * @description 모든 셀이 채워져 있고 충돌이 없어야 함
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @returns {boolean} 완성 여부
 */
export function isBoardComplete(board: SudokuBoard): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @description 킬러 스도쿠 케이지 유효성 검사 및 충돌 표시
 * @param {SudokuBoard} board - 보드
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {SudokuBoard} 보드
 */
export function validateKillerCages(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  const newBoard = structuredClone(board);

  // 먼저 일반 스도쿠 규칙으로 충돌 검사
  const boardWithBasicConflicts = checkConflicts(newBoard);

  // 각 케이지별 검증
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;
    let hasConflict = false;

    // 케이지 내 모든 셀 검사
    for (const [row, col] of cage.cells) {
      const value = boardWithBasicConflicts[row][col].value;

      if (value === null) {
        allFilled = false;
        continue;
      }

      sum += value;

      // 케이지 내 중복 검사
      if (usedNumbers.has(value)) {
        hasConflict = true;
      }
      usedNumbers.add(value);
    }

    // 케이지 완성 시 합계 검사
    if (allFilled && sum !== cage.sum) {
      hasConflict = true;
    }

    // 진행 중에도 합이 초과되면 충돌
    if (sum > cage.sum) {
      hasConflict = true;
    }

    // 충돌이 있으면 케이지 내 모든 채워진 셀에 충돌 표시
    if (hasConflict) {
      for (const [row, col] of cage.cells) {
        if (boardWithBasicConflicts[row][col].value !== null) {
          boardWithBasicConflicts[row][col].isConflict = true;
        }
      }
    }
  }

  return boardWithBasicConflicts;
}

/**
 * @description 킬러 스도쿠 보드 완성도 검사
 * @param {SudokuBoard} board - 보드
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {boolean} 완성 여부
 */
export function isKillerBoardComplete(board: SudokuBoard, cages: KillerCage[]): boolean {
  // 1. 모든 셀이 채워져 있는지 확인
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }

  // 2. 모든 케이지 규칙이 만족되는지 확인
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();

    for (const [row, col] of cage.cells) {
      const value = board[row][col].value!;
      sum += value;

      if (usedNumbers.has(value)) {
        return false; // 케이지 내 중복
      }
      usedNumbers.add(value);
    }

    if (sum !== cage.sum) {
      return false; // 합계 불일치
    }
  }

  return true;
}
