import {
  BASE_GRID,
  BLOCK_SIZE,
  CellHighlight,
  Difficulty,
  DIFFICULTY_RANGES,
  Grid,
  GRID_SIZE,
  GridPosition,
  KILLER_DIFFICULTY_RANGES,
  KillerCage,
  NUMBERS,
  SudokuBoard,
} from "@entities/sudoku/model";

/**
 * @description 스도쿠 유틸리티 모듈
 * @module SudokuEngine
 */

/**
 * 유효한 스도쿠 솔루션 생성
 * @returns {Grid} 완성된 스도쿠 그리드
 */
export const generateSolution = (): Grid => {
  // 솔루션 복제
  const solution = structuredClone(BASE_GRID);

  // 변환 파이프라인 적용
  applyTransformations(solution);

  return solution;
};

// 빈 스도쿠 보드 생성 헬퍼 함수
export const createEmptyBoard = (): SudokuBoard =>
  Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => ({
          value: null,
          isInitial: false,
          isSelected: false,
          isConflict: false,
          notes: [],
        })),
    );

/**
 * @description 빈 스도쿠 하이라이트 생성
 * @returns {Record<string, CellHighlight>} 빈 스도쿠 하이라이트
 */
export const createEmptyHighlights = (): Record<string, CellHighlight> => {
  const highlights: Record<string, CellHighlight> = {};

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const key = `${row}-${col}`;
      highlights[key] = {
        selected: false,
        related: false,
        sameValue: false,
      };
    }
  }

  return highlights;
};

/**
 * @description 스도쿠 그리드에 무작위 변환 적용
 * @description 유효성을 유지하면서 패턴 변형
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
 * @description 무작위 숫자 매핑 생성 (1-9 → 1-9 셔플)
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
 * @description 숫자 매핑을 그리드에 적용
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
 * @description 그리드 회전 또는 반사 적용
 * @param {Grid} grid - 대상 그리드
 */
const rotateOrReflectGrid = (grid: Grid): void => {
  const operations = [() => rotateGrid90(grid), () => reflectHorizontal(grid), () => reflectVertical(grid)];

  // 무작위 작업 선택
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
};

/**
 * @description 그리드를 90도 회전
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
 * @description 그리드 수평 반사
 * @param {Grid} grid - 대상 그리드
 */
const reflectHorizontal = (grid: Grid): void => {
  grid.reverse();
};

/**
 * @description 그리드 수직 반사
 * @param {Grid} grid - 대상 그리드
 */
const reflectVertical = (grid: Grid): void => {
  for (let row = 0; row < GRID_SIZE; row++) {
    grid[row].reverse();
  }
};

/**
 * @description 블록 내에서 무작위 행 교환
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
 * @description 블록 내에서 무작위 열 교환
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
 * @description 무작위 행 블록 교환
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
 * @description 무작위 열 블록 교환
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
 * @description 배열을 무작위로 섞는 함수 (Fisher-Yates 알고리즘)
 * @param {T[]} array - 섞을 배열
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * @description 새 스도쿠 보드 생성
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
 * @description 완성된 솔루션으로부터 초기 보드 생성
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
 * @description 무작위 셀 제거 (난이도 설정)
 * @description 유일 솔루션을 보장하기 위한 알고리즘
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} count - 제거할 셀 수
 */
const removeRandomCells = (board: SudokuBoard, solution: Grid, count: number): void => {
  // 모든 위치를 배열로 만듦
  const allPositions: GridPosition[] = [];
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

    // 원래 값 저장
    const originalValue = board[row][col].value;

    // 셀 제거 시도
    board[row][col].value = null;
    board[row][col].isInitial = false;

    // 유일 솔루션 검증
    // 단일 솔루션이 아니면 셀 복원
    if (!hasUniqueSolution(board)) {
      board[row][col].value = originalValue;
      board[row][col].isInitial = true;
      continue; // 이 셀은 제거하지 않고 다음 셀로 이동
    }

    removed++;
  }

  // 목표한 셀 수를 제거하지 못했다면, 최대한 제거된 상태로 유지
  // 유일 솔루션 제약으로 인해 count 개수만큼 제거하지 못할 수 있음
  console.log(`목표 제거 수: ${count}, 실제 제거 수: ${removed}`);
};

/**
 * @description 스도쿠 보드의 충돌 확인 및 표시
 * @description 행, 열, 3x3 블록 규칙 검증
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
 * @description 특정 셀에 충돌이 있는지 확인
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
 * @description 행 내 충돌 검사
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} value - 확인할 숫자
 * @returns {boolean} 충돌 여부
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
 * @description 열 내 충돌 검사
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {number} row - 행 인덱스
 * @param {number} col - 열 인덱스
 * @param {number} value - 확인할 숫자
 * @returns {boolean} 충돌 여부
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
 * @description 스도쿠 보드가 완성되었는지 확인
 * @description 모든 셀이 채워져 있고 충돌이 없어야 함
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
 * @description 스도쿠 보드가 원본 솔루션과 일치하는지 확인
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @returns {boolean} 일치 여부
 */
export const isBoardCorrect = (board: SudokuBoard, solution: Grid): boolean => {
  return board.every((row, rowIdx) => row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx]));
};

/**
 * @description 힌트 제공 - 무작위 빈 셀에 정답 채우기
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {Grid} solution - 정답 그리드
 * @returns {GridPosition & { value: number }} 힌트 정보
 */
export const getHint = (board: SudokuBoard, solution: Grid): { row: number; col: number; value: number } | null => {
  const emptyCells: GridPosition[] = [];

  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value === null) {
        emptyCells.push([rowIdx, colIdx]);
      }
    });
  });

  if (emptyCells.length === 0) return null; // 빈 셀이 없으면 null 반환

  // 무작위 빈 셀 선택
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [row, col] = emptyCells[randomIndex];

  return {
    row,
    col,
    value: solution[row][col],
  };
};

/**
 * @description 시간 형식 포맷팅 (초 -> 분:초)
 * @param {number} seconds - 초 단위 시간
 * @returns {string} 포맷된 시간 문자열
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * @description 백트래킹 알고리즘을 이용한 스도쿠 솔버
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
 * @description 백트래킹 알고리즘 구현
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
 * @description 그리드에서 빈 셀 찾기
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @returns {GridPosition | null} 빈 셀 위치 또는 null
 */
const findEmptyCell = (grid: (number | null)[][]): GridPosition | null => {
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
 * @description 영향받은 셀 정보를 저장할 타입 정의
 */
type AffectedCell = [row: number, col: number, num: number];

/**
 * @description 셀에 값이 입력되었을 때 영향받는 셀들의 후보 업데이트
 */
const updateCandidates = (
  row: number,
  col: number,
  num: number,
  candidates: number[][][],
  affectedCells: AffectedCell[],
): void => {
  // 같은 행, 열, 블록 내의 셀들에서 num을 후보에서 제거

  // 행 처리
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && candidates[row][c].includes(num)) {
      const idx = candidates[row][c].indexOf(num);
      if (idx !== -1) {
        candidates[row][c].splice(idx, 1);
        affectedCells.push([row, c, num]); // 영향받은 셀 기록 (복원용)
      }
    }
  }

  // 열 처리
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && candidates[r][col].includes(num)) {
      const idx = candidates[r][col].indexOf(num);
      if (idx !== -1) {
        candidates[r][col].splice(idx, 1);
        affectedCells.push([r, col, num]);
      }
    }
  }

  // 블록 처리
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      const curRow = blockRow + r;
      const curCol = blockCol + c;

      if ((curRow !== row || curCol !== col) && candidates[curRow][curCol].includes(num)) {
        const idx = candidates[curRow][curCol].indexOf(num);
        if (idx !== -1) {
          candidates[curRow][curCol].splice(idx, 1);
          affectedCells.push([curRow, curCol, num]);
        }
      }
    }
  }
};

/**
 * @description 백트래킹 시 후보 복원
 */
const restoreCandidates = (
  row: number,
  col: number,
  num: number,
  candidates: number[][][],
  affectedCells: AffectedCell[],
): void => {
  // 영향받은 셀들의 후보를 복원
  for (const [r, c, n] of affectedCells) {
    if (!candidates[r][c].includes(n)) {
      candidates[r][c].push(n);
    }
  }

  // 처리된 셀 목록 비우기
  affectedCells.length = 0;
};

/**
 * @description 최적화된 유일 솔루션 검증
 * @param {SudokuBoard} board - 스도쿠 보드
 * @returns {boolean} 유일 솔루션 여부
 */
const hasUniqueSolution = (board: SudokuBoard): boolean => {
  // 보드를 그리드 형식으로 변환
  const grid: (number | null)[][] = board.map((row) => row.map((cell) => cell.value));

  // 솔루션 개수 추적
  let solutionCount = 0;

  // 각 셀의 가능한 후보 숫자 미리 계산 (성능 향상)
  const candidates: number[][][] = Array(GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(GRID_SIZE)
        .fill(null)
        .map(() => []),
    );

  // 후보 숫자 초기화
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= GRID_SIZE; num++) {
          if (isValidPlacement(grid, row, col, num)) {
            candidates[row][col].push(num);
          }
        }
      }
    }
  }

  // 가장 후보가 적은 빈 셀 찾기 (최소 후보 휴리스틱)
  const findBestEmptyCell = (): GridPosition | null => {
    let minCandidates = Infinity;
    let bestCell: GridPosition | null = null;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === null) {
          const candidateCount = candidates[row][col].length;
          if (candidateCount < minCandidates) {
            minCandidates = candidateCount;
            bestCell = [row, col];

            // 최적화: 후보가 1개인 셀은 바로 선택 (더 적은 분기 생성)
            if (minCandidates === 1) {
              return bestCell;
            }
          }
        }
      }
    }

    return bestCell;
  };

  // 백트래킹으로 솔루션 개수 세기 (최적화 버전)
  const countSolutions = (): boolean => {
    const emptyCell = findBestEmptyCell();

    // 빈 셀이 없으면 솔루션 발견
    if (!emptyCell) {
      solutionCount++;
      return solutionCount > 1; // 두 개 이상 발견 시 중단
    }

    const [row, col] = emptyCell;
    const cellCandidates = candidates[row][col];

    // 이 셀의 후보에 대해서만 시도
    for (const num of cellCandidates) {
      grid[row][col] = num;

      // 후보 숫자 업데이트 (영향 받는 셀들)
      const affectedCells: AffectedCell[] = [];
      updateCandidates(row, col, num, candidates, affectedCells);

      // 재귀적으로 다음 셀 확인
      if (countSolutions()) {
        return true; // 두 개 이상 발견 시 중단
      }

      // 백트래킹 - 후보 숫자 복원
      grid[row][col] = null;
      restoreCandidates(row, col, num, candidates, affectedCells);
    }

    return false;
  };

  // 솔루션 개수 세기 시작
  const startTime = Date.now();
  const result = countSolutions();
  const endTime = Date.now();

  console.log(`유일 솔루션 검증 소요 시간: ${endTime - startTime}ms`);

  // 정확히 하나의 솔루션만 있어야 함
  return solutionCount === 1;
};

/**
 * @description 특정 위치에 숫자를 놓을 수 있는지 확인
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

// utils.ts에 추가할 함수들

/**
 * @description 킬러 스도쿠 케이지 생성
 * @param {Grid} solution - 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {KillerCage[]} 생성된 케이지 목록
 */
export const generateKillerCages = (solution: Grid, difficulty: Difficulty): KillerCage[] => {
  const cages: KillerCage[] = [];

  // 이미 케이지에 할당된 셀 추적
  const assignedCells = new Set<string>();
  let cageId = 1;

  console.log(difficulty);
  // 난이도에 따른 케이지 크기 제한 설정
  const { maxCageSize } = KILLER_DIFFICULTY_RANGES[difficulty];

  // 모든 셀이 케이지에 할당될 때까지 반복
  while (assignedCells.size < GRID_SIZE * GRID_SIZE) {
    // 시작 셀 선택 (아직 할당되지 않은 셀 중에서)
    const startCell = findUnassignedCell(assignedCells);
    if (!startCell) break; // 모든 셀이 할당됨

    // 난이도에 따라 케이지 크기 조정
    // 쉬운 난이도: 작은 케이지 (2-3개), 어려운 난이도: 큰 케이지 (최대 6개)
    const minSize = 2; // 최소 2개 셀
    const maxSize = Math.min(minSize + Math.floor(Math.random() * (maxCageSize - 1)), maxCageSize);
    const targetSize = Math.min(minSize + Math.floor(Math.random() * (maxSize - minSize + 1)), maxSize);

    // 새 케이지 생성 시작
    const cage: KillerCage = {
      cells: [startCell],
      sum: solution[startCell[0]][startCell[1]],
      id: cageId++,
    };

    // 셀 할당 표시
    assignedCells.add(`${startCell[0]}-${startCell[1]}`);

    // 케이지 확장
    expandCage(cage, solution, assignedCells, targetSize);

    // 케이지 추가
    cages.push(cage);
  }

  return cages;
};

/**
 * @description 할당되지 않은 셀 찾기
 * @param {Set<string>} assignedCells - 이미 할당된 셀 집합
 * @returns {GridPosition | null} 할당되지 않은 셀 또는 null
 */
const findUnassignedCell = (assignedCells: Set<string>): GridPosition | null => {
  // 무작위 순서로 셀 확인 (자연스러운 케이지 분포를 위해)
  const positions: GridPosition[] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row}-${col}`;
      if (!assignedCells.has(key)) {
        positions.push([row, col]);
      }
    }
  }

  if (positions.length === 0) return null;

  // 무작위 선택
  return positions[Math.floor(Math.random() * positions.length)];
};

/**
 * @description 케이지 확장 (인접한 셀 추가)
 * @param {KillerCage} cage - 확장할 케이지
 * @param {Grid} solution - 스도쿠 솔루션
 * @param {Set<string>} assignedCells - 이미 할당된 셀 집합
 * @param {number} targetSize - 목표 케이지 크기
 */
const expandCage = (cage: KillerCage, solution: Grid, assignedCells: Set<string>, targetSize: number): void => {
  // 케이지가 목표 크기에 도달할 때까지 반복
  while (cage.cells.length < targetSize) {
    // 현재 케이지의 모든 셀에 인접한 셀들 찾기
    const adjacentCells = findAdjacentCells(cage.cells, assignedCells);

    // 더 이상 확장할 수 없으면 중단
    if (adjacentCells.length === 0) break;

    // 무작위로 인접 셀 선택
    const nextCell = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];

    // 케이지에 셀 추가 및 합계 업데이트
    cage.cells.push(nextCell);
    cage.sum += solution[nextCell[0]][nextCell[1]];

    // 셀 할당 표시
    assignedCells.add(`${nextCell[0]}-${nextCell[1]}`);
  }
};

/**
 * @description 케이지의 인접 셀 찾기 (아직 할당되지 않은)
 * @param {GridPosition[]} cageCells - 현재 케이지 셀들
 * @param {Set<string>} assignedCells - 이미 할당된 셀 집합
 * @returns {GridPosition[]} 인접한 할당되지 않은 셀 목록
 */
const findAdjacentCells = (cageCells: GridPosition[], assignedCells: Set<string>): GridPosition[] => {
  const adjacentCells: GridPosition[] = [];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]; // 상하좌우

  // 각 케이지 셀에 대해 확인
  for (const [row, col] of cageCells) {
    // 4방향 확인
    for (const [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      // 유효한 범위 내인지 확인
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        const key = `${newRow}-${newCol}`;

        // 아직 할당되지 않은 셀인지 확인
        if (!assignedCells.has(key)) {
          adjacentCells.push([newRow, newCol]);
        }
      }
    }
  }

  // 중복 제거 (같은 셀이 여러 케이지 셀에 인접할 수 있음)
  return Array.from(new Map(adjacentCells.map((cell) => [`${cell[0]}-${cell[1]}`, cell])).values());
};

/**
 * @description 킬러 스도쿠 모드 게임 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {{ board: SudokuBoard, cages: KillerCage[] }} 생성된 킬러 스도쿠 보드
 */
export const generateKillerBoard = (
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } => {
  // 기본 보드 생성
  const board = createInitialBoard(solution);

  // 케이지 생성
  const cages = generateKillerCages(solution, difficulty);

  // 난이도에 따른 힌트 셀 수 설정
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];

  // 킬러 모드는 일반 모드보다 힌트 셀이 적음
  // 총 81개 셀 중 제거할 셀 수 계산
  const cellsToRemove = 81 - hintsKeep;

  // 셀 제거 (일반 스도쿠와 동일한 유일 솔루션 보장 로직 사용)
  removeRandomCells(board, solution, cellsToRemove);

  return { board, cages };
};

/**
 * @description 케이지 내 숫자 합계 및 중복 검증
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {SudokuBoard} 케이지 검증 상태가 업데이트된 보드
 */
export const validateKillerCages = (board: SudokuBoard, cages: KillerCage[]): SudokuBoard => {
  const newBoard = structuredClone(board);

  // 케이지 고유 ID를 키로 사용하는 충돌 맵
  const cageConflicts = new Map<number, boolean>();

  // 각 케이지 검증
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;

    // 케이지 내 모든 셀 순회
    for (const [row, col] of cage.cells) {
      const value = newBoard[row][col].value;

      // 빈 셀이 있는 경우
      if (value === null) {
        allFilled = false;
        continue;
      }

      // 합계 계산
      sum += value;

      // 케이지 내 중복 숫자 검사
      if (usedNumbers.has(value)) {
        cageConflicts.set(cage.id, true);
        break;
      }

      usedNumbers.add(value);
    }

    // 케이지가 모두 채워졌고 합이 맞지 않는 경우
    if (allFilled && sum !== cage.sum) {
      cageConflicts.set(cage.id, true);
    } else if (!cageConflicts.has(cage.id)) {
      cageConflicts.set(cage.id, false);
    }
  }

  // 보드에 케이지 충돌 상태 반영
  for (const cage of cages) {
    const hasConflict = cageConflicts.get(cage.id) || false;

    if (hasConflict) {
      // 케이지 내 모든 셀에 충돌 표시
      for (const [row, col] of cage.cells) {
        if (newBoard[row][col].value !== null) {
          newBoard[row][col].isConflict = true;
        }
      }
    }
  }

  return newBoard;
};

/**
 * @description 킬러 스도쿠 모드의 보드 충돌 확인 (일반 규칙 + 케이지 규칙)
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {SudokuBoard} 충돌 상태가 업데이트된 보드
 */
export const checkKillerConflicts = (board: SudokuBoard, cages: KillerCage[]): SudokuBoard => {
  // 1. 일반 스도쿠 규칙 검사 (행, 열, 블록)
  let newBoard = checkConflicts(board);

  // 2. 킬러 스도쿠 케이지 규칙 검사
  newBoard = validateKillerCages(newBoard, cages);

  return newBoard;
};
