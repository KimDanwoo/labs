import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { SudokuBoard } from "@entities/board/model/types";
import { Grid, GridPosition } from "@entities/sudoku/model/types";

/**
 * @description 특정 위치에 숫자를 놓을 수 있는지 확인
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} num - 확인할 숫자
 * @returns {boolean} 유효 여부
 */
export function isValidPlacement(grid: (number | null)[][], row: number, col: number, num: number): boolean {
  // 행 검사
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (grid[row][c] === num) return false;
  }

  // 열 검사
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (grid[r][col] === num) return false;
  }

  // 블록 검사
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      if (grid[blockRow + r][blockCol + c] === num) return false;
    }
  }

  return true;
}

/**
 * @description 유일 솔루션 검사
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @returns {boolean} 유일 솔루션 여부
 */
export function hasUniqueSolution(grid: (number | null)[][]): boolean {
  let solutionCount = 0;
  const MAX_SOLUTIONS = 2;

  // 원본 그리드 복제
  const tempGrid = grid.map((row) => [...row]);

  // 가장 제약이 많은 빈 셀부터 처리하는 백트래킹
  function countSolutions(index = 0, emptyCells: GridPosition[] = []): boolean {
    // 빈 셀 목록 초기화 (첫 호출 시만)
    if (index === 0 && emptyCells.length === 0) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (tempGrid[r][c] === null) {
            emptyCells.push([r, c]);
          }
        }
      }

      // 제약 많은 셀부터 처리 (후보가 적은 셀)
      emptyCells.sort((a, b) => {
        const candidatesA = countValidNumbers(tempGrid, a[0], a[1]);
        const candidatesB = countValidNumbers(tempGrid, b[0], b[1]);
        return candidatesA - candidatesB;
      });
    }

    // 모든 빈 셀이 채워짐 -> 솔루션 발견
    if (index >= emptyCells.length) {
      solutionCount++;
      return solutionCount >= MAX_SOLUTIONS;
    }

    const [row, col] = emptyCells[index];

    // 이 셀에 가능한 모든 숫자 시도
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(tempGrid, row, col, num)) {
        tempGrid[row][col] = num;

        // 다음 셀로 재귀 호출
        if (countSolutions(index + 1, emptyCells)) {
          return true; // 두 개 이상의 솔루션 발견
        }

        tempGrid[row][col] = null; // 백트래킹
      }
    }

    return false;
  }

  // 셀에 넣을 수 있는 유효한 숫자 개수 계산
  function countValidNumbers(item: (number | null)[][], row: number, col: number): number {
    let count = 0;
    for (let num = 1; num <= 9; num++) {
      if (isValidPlacement(item, row, col, num)) {
        count++;
      }
    }
    return count;
  }

  // 솔루션 카운트 시작
  countSolutions();

  // 정확히 하나의 솔루션만 있어야 함
  return solutionCount === 1;
}

/**
 * @description 행 내 충돌 검사
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} value - 확인할 숫자
 * @returns {boolean} 충돌 여부
 */
export function checkRowConflict(board: SudokuBoard, row: number, col: number, value: number): boolean {
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c !== col && board[row][c].value === value) {
      return true;
    }
  }
  return false;
}

/**
 * @description 열 내 충돌 검사
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} value - 확인할 숫자
 * @returns {boolean} 충돌 여부
 */
export function checkColConflict(board: SudokuBoard, row: number, col: number, value: number): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (r !== row && board[r][col].value === value) {
      return true;
    }
  }
  return false;
}

/**
 * @description 3x3 블록 내 충돌 검사
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} value - 확인할 숫자
 * @returns {boolean} 충돌 여부
 */
export function checkBlockConflict(board: SudokuBoard, row: number, col: number, value: number): boolean {
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      const curRow = blockRow + r;
      const curCol = blockCol + c;
      if ((curRow !== row || curCol !== col) && board[curRow][curCol].value === value) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @description 특정 셀에 충돌이 있는지 확인
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @returns {boolean} 충돌 여부
 */
export function hasConflict(board: SudokuBoard, row: number, col: number): boolean {
  const value = board[row][col].value;
  if (value === null) return false;

  // 행 검사
  if (checkRowConflict(board, row, col, value)) return true;

  // 열 검사
  if (checkColConflict(board, row, col, value)) return true;

  // 3x3 블록 검사
  if (checkBlockConflict(board, row, col, value)) return true;

  return false;
}

/**
 * @description 스도쿠 보드의 충돌 확인 및 표시
 * @description 행, 열, 3x3 블록 규칙 검증
 * @param {SudokuBoard} board - 검사할 스도쿠 보드
 * @returns {SudokuBoard} 충돌 정보가 업데이트된 보드
 */
export function checkConflicts(board: SudokuBoard): SudokuBoard {
  const newBoard = structuredClone(board);

  // 모든 셀에 대해 충돌 검사
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (newBoard[row][col].value === null) {
        newBoard[row][col].isConflict = false;
        continue;
      }

      newBoard[row][col].isConflict = hasConflict(newBoard, row, col);
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
 * @description 스도쿠 보드가 원본 솔루션과 일치하는지 확인
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @returns {boolean} 일치 여부
 */
export function isBoardCorrect(board: SudokuBoard, solution: Grid): boolean {
  return board.every((row, rowIdx) => row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx]));
}
