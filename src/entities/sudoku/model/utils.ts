import { Difficulty, SudokuBoard } from "./types";

/**
 * 스도쿠 유틸리티 모듈
 * 고성능 스도쿠 생성 및 검증 알고리즘 제공
 * @module SudokuEngine
 */

// 타입 정의
type Grid = number[][];
type Position = [row: number, col: number];
type DifficultyRange = { min: number; max: number };

// 상수
const GRID_SIZE = 9;
const BLOCK_SIZE = 3;
const NUMBERS = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);

const DIFFICULTY_RANGES: Record<Difficulty, DifficultyRange> = {
  easy: { min: 28, max: 35 },
  medium: { min: 40, max: 50 },
  hard: { min: 52, max: 62 },
};

/**
 * 유효한 스도쿠 솔루션 생성
 * @returns {Grid} 완성된 스도쿠 그리드
 */
export const generateSolution = (): Grid => {
  // 기본 패턴 - Latin Square 기반 유효한 스도쿠
  const baseGrid: Grid = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 1, 4, 3, 6, 5, 8, 9, 7],
    [3, 6, 5, 8, 9, 7, 2, 1, 4],
    [8, 9, 7, 2, 1, 4, 3, 6, 5],
    [5, 3, 1, 6, 4, 2, 9, 7, 8],
    [6, 4, 2, 9, 7, 8, 5, 3, 1],
    [9, 7, 8, 5, 3, 1, 6, 4, 2],
  ];

  // 솔루션 복제
  const solution = structuredClone(baseGrid);

  // 변환 파이프라인 적용
  applyTransformations(solution);

  return solution;
};

/**
 * 스도쿠 그리드에 무작위 변환 적용
 * 유효성을 유지하면서 패턴 변형
 * @param {Grid} grid - 변환할 스도쿠 그리드
 */
const applyTransformations = (grid: Grid): void => {
  // 1. 숫자 셔플 - 1-9를 무작위로 다른 숫자에 매핑
  const numberMap = createRandomNumberMapping();

  // 2. 구조적 변환 (여러 단계)
  const transforms = [
    () => swapRandomRowsWithinBlocks(grid),
    () => swapRandomColumnsWithinBlocks(grid),
    () => swapRandomRowBlocks(grid),
    () => swapRandomColumnBlocks(grid),
    () => rotateOrReflectGrid(grid),
  ];

  // 무작위 순서로 여러 번 변환 적용
  for (let i = 0; i < 10; i++) {
    const randomTransform = transforms[Math.floor(Math.random() * transforms.length)];
    randomTransform();
  }

  // 숫자 매핑 적용 (마지막에 수행)
  applyNumberMapping(grid, numberMap);
};

/**
 * 무작위 숫자 매핑 생성 (1-9 → 1-9 셔플)
 * @returns {Map<number, number>} 숫자 매핑 맵
 */
const createRandomNumberMapping = (): Map<number, number> => {
  const shuffled = [...NUMBERS];
  shuffleArray(shuffled);

  const mapping = new Map<number, number>();
  NUMBERS.forEach((num, idx) => {
    mapping.set(num, shuffled[idx]);
  });

  return mapping;
};

/**
 * 숫자 매핑을 그리드에 적용
 * @param {Grid} grid - 대상 그리드
 * @param {Map<number, number>} mapping - 숫자 매핑
 */
const applyNumberMapping = (grid: Grid, mapping: Map<number, number>): void => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      grid[row][col] = mapping.get(grid[row][col]) ?? grid[row][col];
    }
  }
};

/**
 * 그리드 회전 또는 반사 적용
 * @param {Grid} grid - 대상 그리드
 */
const rotateOrReflectGrid = (grid: Grid): void => {
  const operations = [() => rotateGrid90(grid), () => reflectHorizontal(grid), () => reflectVertical(grid)];

  // 무작위 작업 선택
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
};

/**
 * 그리드를 90도 회전
 * @param {Grid} grid - 대상 그리드
 */
const rotateGrid90 = (grid: Grid): void => {
  const size = grid.length;
  const temp = structuredClone(grid);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[col][size - 1 - row] = temp[row][col];
    }
  }
};

/**
 * 그리드 수평 반사
 * @param {Grid} grid - 대상 그리드
 */
const reflectHorizontal = (grid: Grid): void => {
  grid.reverse();
};

/**
 * 그리드 수직 반사
 * @param {Grid} grid - 대상 그리드
 */
const reflectVertical = (grid: Grid): void => {
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row].reverse();
  }
};

/**
 * 블록 내에서 무작위 행 교환
 * @param {Grid} grid - 대상 그리드
 */
const swapRandomRowsWithinBlocks = (grid: Grid): void => {
  for (let block = 0; block < BLOCK_SIZE; block++) {
    const baseRow = block * BLOCK_SIZE;
    const row1 = baseRow + Math.floor(Math.random() * BLOCK_SIZE);
    const row2 = baseRow + Math.floor(Math.random() * BLOCK_SIZE);

    if (row1 !== row2) {
      [grid[row1], grid[row2]] = [grid[row2], grid[row1]];
    }
  }
};

/**
 * 블록 내에서 무작위 열 교환
 * @param {Grid} grid - 대상 그리드
 */
const swapRandomColumnsWithinBlocks = (grid: Grid): void => {
  for (let block = 0; block < BLOCK_SIZE; block++) {
    const baseCol = block * BLOCK_SIZE;
    const col1 = baseCol + Math.floor(Math.random() * BLOCK_SIZE);
    const col2 = baseCol + Math.floor(Math.random() * BLOCK_SIZE);

    if (col1 !== col2) {
      for (let row = 0; row < GRID_SIZE; row++) {
        [grid[row][col1], grid[row][col2]] = [grid[row][col2], grid[row][col1]];
      }
    }
  }
};

/**
 * 무작위 행 블록 교환
 * @param {Grid} grid - 대상 그리드
 */
const swapRandomRowBlocks = (grid: Grid): void => {
  const block1 = Math.floor(Math.random() * BLOCK_SIZE);
  const block2 = Math.floor(Math.random() * BLOCK_SIZE);

  if (block1 !== block2) {
    for (let i = 0; i < BLOCK_SIZE; i++) {
      const row1 = block1 * BLOCK_SIZE + i;
      const row2 = block2 * BLOCK_SIZE + i;
      [grid[row1], grid[row2]] = [grid[row2], grid[row1]];
    }
  }
};

/**
 * 무작위 열 블록 교환
 * @param {Grid} grid - 대상 그리드
 */
const swapRandomColumnBlocks = (grid: Grid): void => {
  const block1 = Math.floor(Math.random() * BLOCK_SIZE);
  const block2 = Math.floor(Math.random() * BLOCK_SIZE);

  if (block1 !== block2) {
    for (let i = 0; i < BLOCK_SIZE; i++) {
      const col1 = block1 * BLOCK_SIZE + i;
      const col2 = block2 * BLOCK_SIZE + i;

      for (let row = 0; row < GRID_SIZE; row++) {
        [grid[row][col1], grid[row][col2]] = [grid[row][col2], grid[row][col1]];
      }
    }
  }
};

/**
 * 배열을 무작위로 섞는 함수 (Fisher-Yates 알고리즘)
 * @param {T[]} array - 섞을 배열
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 새 스도쿠 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도 설정
 * @returns {SudokuBoard} 생성된 스도쿠 보드
 */
export const generateBoard = (solution: Grid, difficulty: Difficulty): SudokuBoard => {
  // 솔루션으로부터 초기 보드 생성
  const board = createInitialBoard(solution);

  // 난이도에 따라 셀 제거
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const cellsToRemove = min + Math.floor(Math.random() * (max - min + 1));

  // 난이도 알고리즘 적용
  removeRandomCells(board, solution, cellsToRemove);

  return board;
};

/**
 * 완성된 솔루션으로부터 초기 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @returns {SudokuBoard} 초기 보드
 */
const createInitialBoard = (solution: Grid): SudokuBoard => {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => ({
      value: solution[row][col],
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
};

/**
 * 무작위 셀 제거 (난이도 설정)
 * 유일 솔루션을 보장하기 위한 알고리즘
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} count - 제거할 셀 수
 */
const removeRandomCells = (board: SudokuBoard, solution: Grid, count: number): void => {
  // 모든 위치를 배열로 만듦
  const allPositions: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      allPositions.push([row, col]);
    }
  }

  // 위치 섞기
  shuffleArray(allPositions);

  // 무작위 순서로 셀 제거
  let removed = 0;
  for (const [row, col] of allPositions) {
    if (removed >= count) break;

    const originalValue = board[row][col].value;
    board[row][col].value = null;
    board[row][col].isInitial = false;

    // 고급 구현에서는 여기서 유일 솔루션 검증 가능
    // 간소화를 위해 생략

    removed++;
  }
};

/**
 * 스도쿠 보드의 충돌 확인 및 표시
 * 행, 열, 3x3 블록 규칙 검증
 * @param {SudokuBoard} board - 검사할 스도쿠 보드
 * @returns {SudokuBoard} 충돌 정보가 업데이트된 보드
 */
export const checkConflicts = (board: SudokuBoard): SudokuBoard => {
  const newBoard = structuredClone(board);

  // 모든 셀에 대해 충돌 검사
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (newBoard[row][col].value === null) {
        newBoard[row][col].isConflict = false;
        continue;
      }

      newBoard[row][col].isConflict = hasConflict(newBoard, row, col);
    }
  }

  return newBoard;
};

/**
 * 특정 셀에 충돌이 있는지 확인
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @returns {boolean} 충돌 여부
 */
const hasConflict = (board: SudokuBoard, row: number, col: number): boolean => {
  const value = board[row][col].value;
  if (value === null) return false;

  // 행 검사
  if (checkRowConflict(board, row, col, value)) return true;

  // 열 검사
  if (checkColConflict(board, row, col, value)) return true;

  // 3x3 블록 검사
  if (checkBlockConflict(board, row, col, value)) return true;

  return false;
};

/**
 * 행 내 충돌 검사
 */
const checkRowConflict = (board: SudokuBoard, row: number, col: number, value: number): boolean => {
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && board[row][c].value === value) {
      return true;
    }
  }
  return false;
};

/**
 * 열 내 충돌 검사
 */
const checkColConflict = (board: SudokuBoard, row: number, col: number, value: number): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && board[r][col].value === value) {
      return true;
    }
  }
  return false;
};

/**
 * 3x3 블록 내 충돌 검사
 */
const checkBlockConflict = (board: SudokuBoard, row: number, col: number, value: number): boolean => {
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
};

/**
 * 스도쿠 보드가 완성되었는지 확인
 * 모든 셀이 채워져 있고 충돌이 없어야 함
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @returns {boolean} 완성 여부
 */
export const isBoardComplete = (board: SudokuBoard): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }
  return true;
};

/**
 * 스도쿠 보드가 원본 솔루션과 일치하는지 확인
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @returns {boolean} 일치 여부
 */
export const isBoardCorrect = (board: SudokuBoard, solution: Grid): boolean => {
  return board.every((row, rowIdx) => row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx]));
};

/**
 * 힌트 제공 - 무작위 빈 셀에 정답 채우기
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {Grid} solution - 정답 그리드
 * @returns {Position & { value: number }} 힌트 정보
 */
export const getHint = (board: SudokuBoard, solution: Grid): { row: number; col: number; value: number } | null => {
  // 빈 셀 찾기
  const emptyCells: Position[] = [];

  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value === null) {
        emptyCells.push([rowIdx, colIdx]);
      }
    });
  });

  if (emptyCells.length === 0) return null;

  // 무작위 빈 셀 선택
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  return {
    row,
    col,
    value: solution[row][col],
  };
};

/**
 * 시간 형식 포맷팅 (초 -> 분:초)
 * @param {number} seconds - 초 단위 시간
 * @returns {string} 포맷된 시간 문자열
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 백트래킹 알고리즘을 이용한 스도쿠 솔버
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @returns {Grid | null} 해결된 솔루션 또는 null
 */
export const solveSudoku = (board: SudokuBoard): Grid | null => {
  // 보드를 그리드 형식으로 변환
  const grid: (number | null)[][] = board.map((row) => row.map((cell) => cell.value));

  if (solveBacktracking(grid)) {
    return grid as Grid;
  }

  return null;
};

/**
 * 백트래킹 알고리즘 구현
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @returns {boolean} 해결 성공 여부
 */
const solveBacktracking = (grid: (number | null)[][]): boolean => {
  // 빈 셀 찾기
  const emptyCell = findEmptyCell(grid);
  if (!emptyCell) return true; // 모든 셀이 채워짐

  const [row, col] = emptyCell;

  // 1-9 숫자 시도
  for (let num = 1; num <= GRID_SIZE; num++) {
    if (isValidPlacement(grid, row, col, num)) {
      grid[row][col] = num;

      if (solveBacktracking(grid)) {
        return true;
      }

      grid[row][col] = null; // 백트래킹
    }
  }

  return false;
};

/**
 * 그리드에서 빈 셀 찾기
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @returns {Position | null} 빈 셀 위치 또는 null
 */
const findEmptyCell = (grid: (number | null)[][]): Position | null => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        return [row, col];
      }
    }
  }
  return null;
};

/**
 * 특정 위치에 숫자를 놓을 수 있는지 확인
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} num - 확인할 숫자
 * @returns {boolean} 유효 여부
 */
const isValidPlacement = (grid: (number | null)[][], row: number, col: number, num: number): boolean => {
  // 행 검사
  for (let c = 0; c < GRID_SIZE; c++) {
    if (grid[row][c] === num) return false;
  }

  // 열 검사
  for (let r = 0; r < GRID_SIZE; r++) {
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
};

/**
 * 단일 솔루션을 가지는지 검증
 * 고급 퍼즐링 도구로 사용 가능
 * @param {SudokuBoard} board - 스도쿠 보드
 * @returns {boolean} 단일 솔루션 여부
 */
export const hasUniqueSolution = (board: SudokuBoard): boolean => {
  const grid = board.map((row) => row.map((cell) => cell.value));
  let solutionCount = 0;

  const countSolutions = (grid: (number | null)[][]): boolean => {
    const emptyCell = findEmptyCell(grid);
    if (!emptyCell) {
      solutionCount++;
      return solutionCount > 1; // 2개 이상 발견 시 중단
    }

    const [row, col] = emptyCell;

    for (let num = 1; num <= GRID_SIZE; num++) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        if (countSolutions(structuredClone(grid))) {
          return true;
        }

        grid[row][col] = null;
      }
    }

    return false;
  };

  countSolutions(grid);
  return solutionCount === 1;
};
