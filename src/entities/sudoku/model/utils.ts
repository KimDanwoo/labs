/**
 * @description 스도쿠 유틸리티 모듈
 * @module SudokuEngine
 */
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
 * @description 완성된 솔루션으로부터 초기 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @returns {SudokuBoard} 초기 보드
 */
const createInitialBoard = (solution: Grid): SudokuBoard =>
  Array.from({ length: GRID_SIZE }, (_1, row) =>
    Array.from({ length: GRID_SIZE }, (_2, col) => ({
      value: solution[row][col],
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );

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

  // 전략적인 셀 제거를 위한 점수 부여 함수
  const calculateCellScore = (row: number, col: number): number => {
    // 중앙 셀은 더 많은 제약을 가지므로 제거 시 어려워짐
    const centerBonus = Math.abs(4 - row) + Math.abs(4 - col) <= 2 ? 3 : 0;

    // 대각선 셀은 제거 시 어려워짐
    const diagonalBonus = row === col || row + col === 8 ? 2 : 0;

    // 동일한 숫자가 많은 셀은 제거 시 어려워짐
    const value = solution[row][col];
    let sameValueCount = 0;

    // 같은 행, 열, 블록에서 동일한 숫자 개수 확인
    for (let i = 0; i < 9; i++) {
      if (solution[row][i] === value) sameValueCount++;
      if (solution[i][col] === value) sameValueCount++;
    }

    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (solution[blockRow + r][blockCol + c] === value) {
          sameValueCount++;
        }
      }
    }

    // 랜덤 요소 추가 (0-1 사이의 값)
    const randomBonus = Math.random();

    return centerBonus + diagonalBonus + sameValueCount / 10 + randomBonus;
  };

  // 난이도에 따른 제거 전략 선택
  let sortedPositions: GridPosition[];
  if (count < 45) {
    // 쉬운 난이도: 랜덤하게 섞기
    shuffleArray(allPositions);
    sortedPositions = allPositions;
  } else {
    // 어려운 난이도: 전략적으로 정렬
    sortedPositions = [...allPositions].sort((a, b) => {
      const scoreA = calculateCellScore(a[0], a[1]);
      const scoreB = calculateCellScore(b[0], b[1]);
      return scoreB - scoreA; // 내림차순 정렬
    });
  }

  // 빠른 유일성 검사를 위한 임시 그리드
  const tempGrid: (number | null)[][] = board.map((row) => row.map((cell) => cell.value));

  // 배치 처리 최적화: 여러 셀을 한 번에 제거해보고 유일성 검사
  const batchSize = count < 45 ? 5 : 3; // 쉬운 난이도는 더 큰 배치
  let removed = 0;
  let posIndex = 0;

  while (removed < count && posIndex < sortedPositions.length) {
    const cellsToTry: GridPosition[] = [];
    const originalValues: (number | null)[] = [];

    // 배치로 처리할 셀 선택
    for (let i = 0; i < batchSize && posIndex < sortedPositions.length; i++) {
      const [row, col] = sortedPositions[posIndex++];
      if (board[row][col].value !== null) {
        cellsToTry.push([row, col]);
        originalValues.push(board[row][col].value);

        // 임시로 셀 제거
        board[row][col].value = null;
        board[row][col].isInitial = false;
        tempGrid[row][col] = null;
      }
    }

    // 배치에 셀이 없으면 다음으로
    if (cellsToTry.length === 0) continue;

    // 현재 배치로 유일 솔루션이 유지되는지 확인
    let hasUnique = hasUniqueSolution(tempGrid);

    if (!hasUnique) {
      // 유일 솔루션이 아니면, 한 번에 하나씩 셀을 복원하며 확인
      for (let i = 0; i < cellsToTry.length; i++) {
        const [row, col] = cellsToTry[i];
        const originalValue = originalValues[i];

        // 셀 복원
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
        tempGrid[row][col] = originalValue;

        // 나머지 셀로 유일 솔루션 확인
        hasUnique = hasUniqueSolution(tempGrid);
        if (hasUnique) {
          removed += i; // 복원 전까지 성공적으로 제거된 셀 수
          break;
        }
      }

      // 모든 셀을 복원해도 유일 솔루션이 아니면, 모두 복원
      if (!hasUnique) {
        for (let i = 0; i < cellsToTry.length; i++) {
          const [row, col] = cellsToTry[i];
          if (board[row][col].value === null) {
            board[row][col].value = originalValues[i];
            board[row][col].isInitial = true;
            tempGrid[row][col] = originalValues[i];
          }
        }
      }
    } else {
      // 배치 제거가 성공하면 제거된 셀 수 카운트
      removed += cellsToTry.length;
    }

    // 목표 달성하면 중단
    if (removed >= count) break;
  }
};

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

/**
 * @description 유일 솔루션 검사
 * @param {(number | null)[][]} grid - 스도쿠 그리드
 * @returns {boolean} 유일 솔루션 여부
 */
function hasUniqueSolution(grid: (number | null)[][]): boolean {
  let solutionCount = 0;
  const MAX_SOLUTIONS = 2;

  // 가장 제약이 많은 빈 셀부터 처리하는 백트래킹
  function countSolutions(index = 0, emptyCells: GridPosition[] = []): boolean {
    // 빈 셀 목록 초기화 (첫 호출 시만)
    if (index === 0 && emptyCells.length === 0) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === null) {
            emptyCells.push([r, c]);
          }
        }
      }

      // 제약 많은 셀부터 처리 (후보가 적은 셀)
      emptyCells.sort((a, b) => {
        const candidatesA = countValidNumbers(grid, a[0], a[1]);
        const candidatesB = countValidNumbers(grid, b[0], b[1]);
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
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;

        // 다음 셀로 재귀 호출
        if (countSolutions(index + 1, emptyCells)) {
          return true; // 두 개 이상의 솔루션 발견
        }

        grid[row][col] = null; // 백트래킹
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
export const isBoardCorrect = (board: SudokuBoard, solution: Grid): boolean =>
  board.every((row, rowIdx) => row.every((cell, colIdx) => cell.value === solution[rowIdx][colIdx]));

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
 * @description 초기 그리드 설정 시 후보자 업데이트
 */
const updateCandidatesInitial = (
  grid: (number | null)[][],
  candidates: number[][][],
  row: number,
  col: number,
  value: number,
): void => {
  // 같은 행에서 value 제거
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && candidates[row][c].includes(value)) {
      candidates[row][c] = candidates[row][c].filter((num) => num !== value);
    }
  }

  // 같은 열에서 value 제거
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && candidates[r][col].includes(value)) {
      candidates[r][col] = candidates[r][col].filter((num) => num !== value);
    }
  }

  // 같은 블록에서 value 제거
  const blockRow = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE;
  const blockCol = Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      const curRow = blockRow + r;
      const curCol = blockCol + c;
      if ((curRow !== row || curCol !== col) && candidates[curRow][curCol].includes(value)) {
        candidates[curRow][curCol] = candidates[curRow][curCol].filter((num) => num !== value);
      }
    }
  }
};

/**
 * @description 가장 제약이 많은 빈 셀 찾기 (후보가 가장 적은 셀)
 */
const findMostConstrainedCell = (grid: (number | null)[][], candidates: number[][][]): GridPosition | null => {
  let minCandidates = Infinity;
  let bestCell: GridPosition | null = null;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        const candidateCount = candidates[row][col].length;

        // 후보가 없는 셀이 있으면 현재 경로는 실패
        if (candidateCount === 0) return null;

        if (candidateCount < minCandidates) {
          minCandidates = candidateCount;
          bestCell = [row, col];

          // 최적화: 후보가 1개인 셀은 즉시 선택
          if (minCandidates === 1) return bestCell;
        }
      }
    }
  }

  return bestCell;
};

/**
 * @description 셀에 값이 입력되었을 때 영향받는 셀들의 후보 업데이트
 */
const updateCandidates = (
  row: number,
  col: number,
  num: number,
  candidates: number[][][],
  affectedCells: { row: number; col: number; value: number }[],
): void => {
  // 같은 행, 열, 블록 내의 셀들에서 num을 후보에서 제거

  // 행 처리
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col) {
      const index = candidates[row][c].indexOf(num);
      if (index !== -1) {
        candidates[row][c].splice(index, 1);
        affectedCells.push({ row, col: c, value: num });
      }
    }
  }

  // 열 처리
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row) {
      const index = candidates[r][col].indexOf(num);
      if (index !== -1) {
        candidates[r][col].splice(index, 1);
        affectedCells.push({ row: r, col, value: num });
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

      if (curRow !== row || curCol !== col) {
        const index = candidates[curRow][curCol].indexOf(num);
        if (index !== -1) {
          candidates[curRow][curCol].splice(index, 1);
          affectedCells.push({ row: curRow, col: curCol, value: num });
        }
      }
    }
  }
};

/**
 * @description 백트래킹 시 후보 복원
 */
const restoreCandidates = (
  affectedCells: { row: number; col: number; value: number }[],
  candidates: number[][][],
): void => {
  // 영향받은 셀들의 후보를 복원
  for (const { row, col, value } of affectedCells) {
    if (!candidates[row][col].includes(value)) {
      candidates[row][col].push(value);
    }
  }

  // 처리된 셀 목록 비우기
  affectedCells.length = 0;
};

/**
 * @description 후보자 관리를 이용한 개선된 백트래킹 알고리즘
 */
const solveBacktrackingWithCandidates = (grid: (number | null)[][], candidates: number[][][]): boolean => {
  // 가장 제약이 많은 빈 셀 찾기 (후보가 가장 적은 셀)
  const emptyCell = findMostConstrainedCell(grid, candidates);
  if (!emptyCell) return true; // 모든 셀이 채워짐

  const [row, col] = emptyCell;
  const cellCandidates = [...candidates[row][col]]; // 이 셀의 후보 복사

  // 영향받은 셀과 제거된 후보를 추적
  const affectedCells: { row: number; col: number; value: number }[] = [];

  // 각 후보 숫자 시도
  for (const num of cellCandidates) {
    grid[row][col] = num;

    // 이 셀에 num을 배치함으로써 다른 셀의 후보 업데이트
    updateCandidates(row, col, num, candidates, affectedCells);

    // 다음 셀 처리
    if (solveBacktrackingWithCandidates(grid, candidates)) {
      return true;
    }

    // 백트래킹: 후보 복원
    restoreCandidates(affectedCells, candidates);
    grid[row][col] = null;
  }

  return false;
};

/**
 * @description 백트래킹 알고리즘을 이용한 개선된 스도쿠 솔버
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @returns {Grid | null} 해결된 솔루션 또는 null
 */
export const solveSudoku = (board: SudokuBoard): Grid | null => {
  // 보드를 그리드 형식으로 변환
  const grid: (number | null)[][] = board.map((row) => row.map((cell) => cell.value));

  // 초기 후보자 목록 생성
  const candidates: number[][][] = Array(GRID_SIZE)
    .fill(null)
    .map(
      () =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => [...NUMBERS]), // 각 셀에 1-9 모든 숫자를 후보로 설정
    );

  // 초기 후보자 업데이트 (이미 채워진 셀 기반)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col];
      if (value !== null) {
        // 이미 채워진 셀은 후보 제거 및 관련 셀 업데이트
        candidates[row][col] = [value]; // 오직 현재 값만 후보로 남김
        updateCandidatesInitial(grid, candidates, row, col, value);
      }
    }
  }

  if (solveBacktrackingWithCandidates(grid, candidates)) {
    return grid as Grid;
  }

  return null;
};

/**
 * @description 인접한 셀 그룹화
 */
const groupAdjacentCells = (cells: GridPosition[]): GridPosition[][] => {
  const groups: GridPosition[][] = [];
  const visited = new Set<string>();

  for (const cell of cells) {
    const key = `${cell[0]}-${cell[1]}`;
    if (visited.has(key)) continue;

    // 새 그룹 시작
    const group: GridPosition[] = [cell];
    visited.add(key);

    // BFS로 인접 셀 찾기
    let index = 0;
    while (index < group.length) {
      const [currentRow, currentCol] = group[index++];
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]; // 상하좌우

      for (const [dRow, dCol] of directions) {
        const adjRow = currentRow + dRow;
        const adjCol = currentCol + dCol;
        const adjKey = `${adjRow}-${adjCol}`;

        // 인접한 셀이 남은 셀 목록에 있고 아직 방문하지 않았는지
        if (!visited.has(adjKey) && cells.some(([r, c]) => r === adjRow && c === adjCol)) {
          group.push([adjRow, adjCol]);
          visited.add(adjKey);
        }
      }
    }

    groups.push(group);
  }

  return groups;
};

/**
 * @description 남은 셀 처리 (최적화 버전)
 */
const handleRemainingCells = (cages: KillerCage[], assignedCells: Set<string>, solution: Grid): void => {
  // 누락된 셀 목록
  const missingCells: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row}-${col}`;
      if (!assignedCells.has(key)) {
        missingCells.push([row, col]);
      }
    }
  }

  // 누락된 셀이 없으면 종료
  if (missingCells.length === 0) return;

  // 효율적인 케이지 확장 함수 (클로저 패턴으로 메모리 최적화)
  const processRemainingCells = () => {
    // 각 케이지의 셀 맵 (빠른 조회용)
    const cageCellMaps: Set<string>[] = cages.map((cage) => new Set(cage.cells.map(([r, c]) => `${r}-${c}`)));

    // 인접 케이지 찾기 (메모이제이션으로 계산 줄이기)
    const getAdjacentCages = (row: number, col: number): number[] => {
      const adjacentCages: number[] = [];
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]; // 상하좌우

      for (let i = 0; i < cages.length; i++) {
        for (const [dRow, dCol] of directions) {
          const adjRow = row + dRow;
          const adjCol = col + dCol;
          const adjKey = `${adjRow}-${adjCol}`;

          if (cageCellMaps[i].has(adjKey)) {
            adjacentCages.push(i);
            break; // 이 케이지는 이미 인접한 것으로 확인됨
          }
        }
      }

      return adjacentCages;
    };

    // 첫 번째 전략: 인접한 케이지 확장
    for (const [row, col] of missingCells) {
      const key = `${row}-${col}`;
      if (assignedCells.has(key)) continue;

      const adjacentCageIndices = getAdjacentCages(row, col);

      if (adjacentCageIndices.length > 0) {
        // 인접 케이지 중 가장 작은 것 선택 (균형 맞추기)
        adjacentCageIndices.sort((a, b) => cages[a].cells.length - cages[b].cells.length);
        const targetCageIndex = adjacentCageIndices[0];

        // 케이지에 셀 추가
        cages[targetCageIndex].cells.push([row, col]);
        cages[targetCageIndex].sum += solution[row][col];
        assignedCells.add(key);
        cageCellMaps[targetCageIndex].add(key);
      }
    }

    // 두 번째 전략: 남은 셀로 새 케이지 형성
    // 남은 셀끼리 그룹화
    const remainingCells = missingCells.filter(([r, c]) => !assignedCells.has(`${r}-${c}`));

    if (remainingCells.length >= 2) {
      // 인접한 셀끼리 그룹화
      const grouped = groupAdjacentCells(remainingCells);

      // 각 그룹을 별도의 케이지로 만들기
      for (const group of grouped) {
        if (group.length >= 2) {
          // 최소 2개 이상의 셀 필요
          const newCage: KillerCage = {
            cells: group,
            sum: group.reduce((sum, [r, c]) => sum + solution[r][c], 0),
            id: cages.length + 1,
          };

          cages.push(newCage);
          for (const [r, c] of group) {
            assignedCells.add(`${r}-${c}`);
          }
        }
      }
    }

    // 세 번째 전략: 남은 고립된 셀 처리
    // 가장 가까운 케이지에 강제 추가
    const finalRemainingCells = missingCells.filter(([r, c]) => !assignedCells.has(`${r}-${c}`));

    for (const [row, col] of finalRemainingCells) {
      let nearestCage = 0;
      let minDistance = Infinity;

      // 가장 가까운 케이지 찾기
      for (let i = 0; i < cages.length; i++) {
        for (const [cageRow, cageCol] of cages[i].cells) {
          const distance = Math.abs(row - cageRow) + Math.abs(col - cageCol);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCage = i;
          }
        }
      }

      // 가장 가까운 케이지에 추가
      cages[nearestCage].cells.push([row, col]);
      cages[nearestCage].sum += solution[row][col];
      assignedCells.add(`${row}-${col}`);
    }
  };

  processRemainingCells();
};

/**
 * @description 정교한 킬러 스도쿠 케이지 생성 (최적화 버전)
 * @param {Grid} solution - 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {KillerCage[]} 생성된 케이지 목록
 */
export const generateKillerCages = (solution: Grid, difficulty: Difficulty): KillerCage[] => {
  const cages: KillerCage[] = [];
  const assignedCells = new Set<string>();
  let cageId = 1;

  // 난이도에 따른 케이지 크기 제한
  const { maxCageSize } = KILLER_DIFFICULTY_RANGES[difficulty];
  const minCageSize = 2;

  // 격자 순회를 위한 전략 선택
  // 대각선 패턴으로 시작 셀 선택 (더 자연스러운 케이지 분포)
  const cellOrder: GridPosition[] = [];

  // 주 대각선과 부 대각선을 먼저 추가
  for (let i = 0; i < GRID_SIZE; i++) {
    cellOrder.push([i, i]); // 주 대각선
    if (i !== GRID_SIZE - 1 - i) {
      cellOrder.push([i, GRID_SIZE - 1 - i]); // 부 대각선
    }
  }

  // 나머지 셀 추가 (약간의 무작위성 추가)
  const remainingCells: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const isDiagonal = row === col || row === GRID_SIZE - 1 - col;
      if (!isDiagonal) {
        remainingCells.push([row, col]);
      }
    }
  }
  shuffleArray(remainingCells);
  cellOrder.push(...remainingCells);

  // 모든 셀을 처리
  for (const [startRow, startCol] of cellOrder) {
    const key = `${startRow}-${startCol}`;
    if (assignedCells.has(key)) continue;

    // 이 셀부터 새 케이지 시작
    const cage: KillerCage = {
      cells: [[startRow, startCol]],
      sum: solution[startRow][startCol],
      id: cageId,
    };
    assignedCells.add(key);

    // 사용된 숫자 추적 (중복 방지)
    const usedNumbers = new Set<number>([solution[startRow][startCol]]);

    // 목표 크기 설정 (난이도에 따라 다름)
    const targetSize = Math.min(minCageSize + Math.floor(Math.random() * (maxCageSize - minCageSize + 1)), maxCageSize);

    // 효율적인 확장 로직
    const expandCage = () => {
      // 현재 케이지 형태
      const currentShape = new Set<string>(cage.cells.map(([r, c]) => `${r}-${c}`));

      // BFS 패턴으로 확장 (메모리 효율적)
      let attempts = 0;
      const MAX_ATTEMPTS = 100; // 안전장치

      while (cage.cells.length < targetSize && attempts < MAX_ATTEMPTS) {
        attempts++;

        // 모든 인접 셀 찾기 (한 번만 계산)
        const adjacentOptions: Array<{
          pos: GridPosition;
          value: number;
          connections: number;
          numberFrequency: number;
        }> = [];

        for (const [cRow, cCol] of cage.cells) {
          const directions = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]; // 상하좌우

          for (const [dRow, dCol] of directions) {
            const newRow = cRow + dRow;
            const newCol = cCol + dCol;

            // 유효 범위 확인
            if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
              const newKey = `${newRow}-${newCol}`;

              // 이미 처리된 셀이 아닌지 확인
              if (!assignedCells.has(newKey) && !currentShape.has(newKey)) {
                const value = solution[newRow][newCol];

                // 이 셀이 케이지 내 몇 개의 셀과 인접해 있는지 확인
                let connections = 0;
                for (const [checkDRow, checkDCol] of directions) {
                  const checkRow = newRow + checkDRow;
                  const checkCol = newCol + checkDCol;
                  const checkKey = `${checkRow}-${checkCol}`;

                  if (currentShape.has(checkKey)) {
                    connections++;
                  }
                }

                // 이 숫자가 현재 케이지에서 얼마나 자주 사용되는지 확인
                // (중복 숫자는 피하거나 최소화)
                const numberFrequency = usedNumbers.has(value) ? 1 : 0;

                adjacentOptions.push({
                  pos: [newRow, newCol],
                  value,
                  connections,
                  numberFrequency,
                });
              }
            }
          }
        }

        // 인접 셀이 없으면 중단
        if (adjacentOptions.length === 0) break;

        // 옵션 정렬 및 중복 제거
        const uniqueOptions = Array.from(
          new Map(adjacentOptions.map((opt) => [`${opt.pos[0]}-${opt.pos[1]}`, opt])).values(),
        );

        // 최적의 다음 셀 선택 전략:
        // 1. 중복 숫자 피하기 (numberFrequency가 낮은 것)
        // 2. 연결성 높이기 (connections가 높은 것)
        uniqueOptions.sort((a, b) => {
          // 최소 크기에 도달하지 못한 경우 연결성 우선
          if (cage.cells.length < minCageSize) {
            return b.connections - a.connections || a.numberFrequency - b.numberFrequency;
          }

          // 최소 크기 이상일 경우 중복 숫자 회피 우선
          return a.numberFrequency - b.numberFrequency || b.connections - a.connections;
        });

        // 최적 옵션 선택 (약간의 무작위성 추가)
        const bestOption =
          uniqueOptions.length > 0
            ? uniqueOptions[Math.floor(Math.random() * Math.min(3, uniqueOptions.length))]
            : null;

        if (bestOption) {
          const [newRow, newCol] = bestOption.pos;
          cage.cells.push([newRow, newCol]);
          cage.sum += bestOption.value;
          assignedCells.add(`${newRow}-${newCol}`);
          currentShape.add(`${newRow}-${newCol}`);
          usedNumbers.add(bestOption.value);
        } else {
          break;
        }
      }
    };

    // 케이지 확장 실행
    expandCage();

    // 유효한 케이지만 추가 (최소 크기 확인)
    if (cage.cells.length >= minCageSize) {
      cages.push(cage);
      cageId++;
    } else {
      // 케이지가 너무 작으면 셀 할당 해제
      for (const [row, col] of cage.cells) {
        assignedCells.delete(`${row}-${col}`);
      }
    }
  }

  // 누락된 셀 처리
  if (assignedCells.size < GRID_SIZE * GRID_SIZE) {
    handleRemainingCells(cages, assignedCells, solution);
  }

  return cages;
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
  const cageConflicts = new Map<number, boolean>();

  // 먼저 모든 셀의 케이지 관련 충돌 플래그를 초기화
  // 일반 스도쿠 규칙(행, 열, 블록)에 의한 충돌은 유지
  for (const cage of cages) {
    for (const [row, col] of cage.cells) {
      // 일반 규칙 충돌 상태 임시 저장
      const hasStandardConflict = newBoard[row][col].isConflict;
      // 충돌 상태 초기화 (케이지 검증 전)
      newBoard[row][col].isConflict = hasStandardConflict;
    }
  }

  // 각 케이지 검증
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;
    let isConflict = false;

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
        isConflict = true;
      }

      usedNumbers.add(value);
    }

    // 케이지가 모두 채워졌고 합이 맞지 않는 경우
    if (allFilled && sum !== cage.sum) {
      isConflict = true;
    }

    // 합이 이미 케이지 합을 초과하는 경우도 충돌로 처리
    if (sum > cage.sum) {
      isConflict = true;
    }

    cageConflicts.set(cage.id, isConflict);
  }

  // 보드에 케이지 충돌 상태 반영
  for (const cage of cages) {
    const hasConflictNext = cageConflicts.get(cage.id) || false;

    if (hasConflictNext) {
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

/**
 * @description 킬러 스도쿠 보드가 완성되었는지 확인
 * @param {SudokuBoard} board - 확인할 스도쿠 보드
 * @param {KillerCage[]} cages - 케이지 목록
 * @returns {boolean} 완성 여부
 */
export const isKillerBoardComplete = (board: SudokuBoard, cages: KillerCage[]): boolean => {
  // 1. 일반 스도쿠 규칙 확인 (모든 셀이 채워져 있고 충돌이 없는지)
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }

  // 2. 킬러 스도쿠 케이지 규칙 확인
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();

    // 케이지 내 모든 셀 검사
    for (const [row, col] of cage.cells) {
      const value = board[row][col].value;
      if (value === null) {
        return false;
      }

      // 합계 계산
      sum += value;

      // 케이지 내 중복 숫자 확인
      if (usedNumbers.has(value)) {
        return false;
      }

      usedNumbers.add(value);
    }

    // 케이지 합이 정확히 일치하는지 확인
    if (sum !== cage.sum) {
      return false;
    }
  }

  return true; // 모든 조건 충족
};
