/* eslint-disable no-console */

import {
  BASE_GRID,
  BLOCK_SIZE,
  BOARD_SIZE,
  KEY_NUMBER,
  MAX_REMOVAL_ATTEMPTS,
  MIN_EXPERT_HINTS,
  PHASE_1_RATIO,
  SUDOKU_CELL_COUNT,
} from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  applyTransformations,
  generateKillerCages,
  hasUniqueSolution,
  shuffleArray,
} from "@features/game-board/model/utils";

// ============================================================================
// 상수 및 타입 정의
// ============================================================================

interface RemovalStrategy {
  preferCenter: boolean;
  preferCorners: boolean;
  preferEdges: boolean;
  symmetryBonus: number;
  blockDistribution: boolean;
}

interface CellPriority {
  pos: GridPosition;
  priority: number;
}

interface RemovalContext {
  board: SudokuBoard;
  tempGrid: (number | null)[][];
  targetRemove: number;
  difficulty: Difficulty;
}

// ============================================================================
// 순수 유틸리티 함수들
// ============================================================================

/**
 * 깊은 복사 (성능 최적화된 버전)
 */
const deepCopyGrid = (grid: Grid): Grid => grid.map((row) => [...row]);

/**
 * 좌표 관련 순수 함수들
 */
const getBlockCoordinates = (row: number, col: number): [number, number] => [
  Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE,
  Math.floor(col / BLOCK_SIZE) * BLOCK_SIZE,
];

const getCenterDistance = (row: number, col: number): number => Math.abs(4 - row) + Math.abs(4 - col);

const isCorner = (row: number, col: number): boolean => (row === 0 || row === 8) && (col === 0 || col === 8);

const isEdge = (row: number, col: number): boolean => row === 0 || row === 8 || col === 0 || col === 8;

const isCenter = (row: number, col: number): boolean => getCenterDistance(row, col) <= 2;

/**
 * 검증 관련 순수 함수들
 */
const isValidNumberSet = (numbers: readonly number[]): boolean => {
  if (numbers.length !== BOARD_SIZE) return false;
  const numberSet = new Set(numbers);
  return numberSet.size === BOARD_SIZE && KEY_NUMBER.every((n) => numberSet.has(n));
};

const getRowNumbers = (grid: Grid, row: number): number[] => grid[row];

const getColumnNumbers = (grid: Grid, col: number): number[] => grid.map((row) => row[col]);

const getBlockNumbers = (grid: Grid, blockRow: number, blockCol: number): number[] => {
  const block: number[] = [];
  const startRow = blockRow * BLOCK_SIZE;
  const startCol = blockCol * BLOCK_SIZE;

  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      block.push(grid[startRow + r][startCol + c]);
    }
  }

  return block;
};

// ============================================================================
// 검증 함수들 (성능 최적화)
// ============================================================================

/**
 * 최적화된 그리드 검증 함수
 */
function validateBaseGrid(grid: Grid): boolean {
  // 행과 열을 동시에 검증
  for (let i = 0; i < BOARD_SIZE; i++) {
    const rowNumbers = getRowNumbers(grid, i);
    const colNumbers = getColumnNumbers(grid, i);

    if (!isValidNumberSet(rowNumbers) || !isValidNumberSet(colNumbers)) {
      console.error(`Invalid row ${i} or column ${i}`);
      return false;
    }
  }

  // 3x3 블록 검증
  for (let blockRow = 0; blockRow < BLOCK_SIZE; blockRow++) {
    for (let blockCol = 0; blockCol < BLOCK_SIZE; blockCol++) {
      const blockNumbers = getBlockNumbers(grid, blockRow, blockCol);

      if (!isValidNumberSet(blockNumbers)) {
        console.error(`Invalid block [${blockRow}, ${blockCol}]`);
        return false;
      }
    }
  }

  return true;
}

/**
 * 셀 배치 유효성 검사 (수정된 버전)
 */
const isValidPlacement = (grid: Grid, row: number, col: number, num: number): boolean => {
  // 행 검사
  if (grid[row].includes(num)) return false;

  // 열 검사
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] === num) return false;
  }

  // 블록 검사
  const [blockStartRow, blockStartCol] = getBlockCoordinates(row, col);
  for (let r = 0; r < BLOCK_SIZE; r++) {
    for (let c = 0; c < BLOCK_SIZE; c++) {
      if (grid[blockStartRow + r][blockStartCol + c] === num) return false;
    }
  }

  return true;
};

// ============================================================================
// 스도쿠 생성 함수들
// ============================================================================

/**
 * 백트래킹을 이용한 스도쿠 생성 (수정된 버전)
 */
function generateValidSudoku(): Grid {
  const grid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  const fillGrid = (row: number, col: number): boolean => {
    if (row === 9) return true;
    if (col === 9) return fillGrid(row + 1, 0);

    const numbers = [...KEY_NUMBER];
    shuffleArray(numbers);

    for (const num of numbers) {
      if (isValidPlacement(grid, row, col, num)) {
        grid[row][col] = num;
        if (fillGrid(row, col + 1)) {
          return true;
        }
        grid[row][col] = 0;
      }
    }

    return false;
  };

  if (fillGrid(0, 0)) {
    return grid;
  }

  console.warn("백트래킹 생성 실패, BASE_GRID 사용");
  return deepCopyGrid(BASE_GRID);
}

/**
 * 솔루션 생성 (최적화)
 */
export function generateSolution(): Grid {
  if (!validateBaseGrid(BASE_GRID)) {
    console.warn("BASE_GRID가 유효하지 않음, 새로운 그리드 생성");
    const newGrid = generateValidSudoku();
    applyTransformations(newGrid);
    return newGrid;
  }

  const solution = deepCopyGrid(BASE_GRID);
  applyTransformations(solution);

  if (!validateBaseGrid(solution)) {
    console.error("변환 후 그리드가 유효하지 않음, 재생성");
    return generateValidSudoku();
  }

  return solution;
}

/**
 * 초기 보드 생성 (함수형)
 */
export function createInitialBoard(solution: Grid): SudokuBoard {
  return solution.map((row) =>
    row.map((value) => ({
      value,
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
}

// ============================================================================
// 난이도별 전략 함수들
// ============================================================================

/**
 * 난이도별 제거 전략 반환 (순수 함수)
 */
const getRemovalStrategy = (difficulty: Difficulty): RemovalStrategy => {
  const strategies: Record<Difficulty, RemovalStrategy> = {
    easy: {
      preferCenter: false,
      preferCorners: true,
      preferEdges: true,
      symmetryBonus: 0.3,
      blockDistribution: true,
    },
    medium: {
      preferCenter: false,
      preferCorners: false,
      preferEdges: true,
      symmetryBonus: 0.2,
      blockDistribution: true,
    },
    hard: {
      preferCenter: true,
      preferCorners: false,
      preferEdges: false,
      symmetryBonus: 0.1,
      blockDistribution: false,
    },
    expert: {
      preferCenter: true,
      preferCorners: true,
      preferEdges: false,
      symmetryBonus: 0,
      blockDistribution: false,
    },
  };

  return strategies[difficulty];
};

/**
 * 위치별 가중치 계산 (순수 함수)
 */
const calculatePositionWeight = (
  row: number,
  col: number,
  strategy: RemovalStrategy,
  intensityMultiplier: number,
): number => {
  let weight = 0;

  if (strategy.preferCenter && isCenter(row, col)) {
    weight += 0.4 * intensityMultiplier;
  }
  if (strategy.preferCorners && isCorner(row, col)) {
    weight += 0.3 * intensityMultiplier;
  }
  if (strategy.preferEdges && isEdge(row, col) && !isCorner(row, col)) {
    weight += 0.2 * intensityMultiplier;
  }

  // 대칭성 보너스
  if (strategy.symmetryBonus > 0) {
    const symmetricRow = 8 - row;
    const symmetricCol = 8 - col;
    if (row !== symmetricRow || col !== symmetricCol) {
      weight += strategy.symmetryBonus;
    }
  }

  // 블록 분산 보너스
  if (strategy.blockDistribution) {
    const blockId = Math.floor(row / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(col / BLOCK_SIZE);
    weight += (blockId % BLOCK_SIZE) * 0.1;
  }

  return weight;
};

/**
 * 강도별 보너스 계산 (순수 함수)
 */
const calculateIntensityBonus = (
  row: number,
  col: number,
  targetRemove: number,
  isHighIntensity: boolean,
  isMediumIntensity: boolean,
): number => {
  let bonus = 0;
  const centerDistance = getCenterDistance(row, col);

  if (isHighIntensity) {
    if (centerDistance <= BLOCK_SIZE) bonus += 0.2;
    bonus += 0.3;
    if ((row + col) % 2 === 0) bonus += 0.1; // 체크보드 패턴
  } else if (isMediumIntensity) {
    if (centerDistance <= 2) bonus += 0.1;
    bonus += 0.15;
  }

  return bonus;
};

const getIntensity = (isHigh: boolean, isMiddle: boolean) => {
  if (isHigh) {
    return 1.5;
  }

  if (isMiddle) {
    return 1.2;
  }

  return 1.0;
};

/**
 * 셀 우선순위 계산 (함수형)
 */
const calculateCellPriorities = (strategy: RemovalStrategy, targetRemove: number): CellPriority[] => {
  const removalIntensity = targetRemove / SUDOKU_CELL_COUNT;
  const isHighIntensity = removalIntensity > 0.6;
  const isMediumIntensity = removalIntensity > 0.4;
  const intensityMultiplier = getIntensity(isHighIntensity, isMediumIntensity);

  const cells: CellPriority[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const basePriority = Math.random() * (isHighIntensity ? 0.2 : 0.3);
      const positionWeight = calculatePositionWeight(row, col, strategy, intensityMultiplier);
      const intensityBonus = calculateIntensityBonus(row, col, targetRemove, isHighIntensity, isMediumIntensity);

      const priority = basePriority + positionWeight + intensityBonus;
      cells.push({ pos: [row, col], priority });
    }
  }

  return cells.sort((a, b) => b.priority - a.priority).slice(0, Math.floor(targetRemove * 1.5));
};

// ============================================================================
// 셀 제거 함수들
// ============================================================================

/**
 * Phase 1 제거 (빠른 배치 제거)
 */
const executePhase1Removal = (context: RemovalContext, cellsToRemove: CellPriority[]): number => {
  const { board, tempGrid, targetRemove } = context;
  const phase1Target = Math.floor(targetRemove * PHASE_1_RATIO);
  let removedCount = 0;

  const batch = cellsToRemove.slice(0, phase1Target);

  for (const { pos } of batch) {
    const [row, col] = pos;
    if (tempGrid[row][col] === null) continue;

    tempGrid[row][col] = null;
    board[row][col].value = null;
    board[row][col].isInitial = false;
    removedCount++;
  }

  console.log(`Phase 1 완료: ${removedCount}개 제거됨`);
  return removedCount;
};

/**
 * Phase 2 제거 (신중한 제거 with 검증)
 */
const executePhase2Removal = (
  context: RemovalContext,
  cellsToRemove: CellPriority[],
  phase1Removed: number,
): number => {
  const { board, tempGrid, targetRemove, difficulty } = context;
  const phase1Target = Math.floor(targetRemove * PHASE_1_RATIO);
  const needsStrictValidation = difficulty === "easy" || difficulty === "medium";
  let additionalRemoved = 0;

  for (let i = phase1Target; i < cellsToRemove.length && phase1Removed + additionalRemoved < targetRemove; i++) {
    const { pos } = cellsToRemove[i];
    const [row, col] = pos;

    if (tempGrid[row][col] === null) continue;

    const originalValue = tempGrid[row][col];
    tempGrid[row][col] = null;

    const shouldValidate = needsStrictValidation && additionalRemoved % 5 === 0;
    const isValid = !shouldValidate || hasUniqueSolution(tempGrid);

    if (isValid) {
      board[row][col].value = null;
      board[row][col].isInitial = false;
      additionalRemoved++;
    } else {
      tempGrid[row][col] = originalValue;
    }
  }

  console.log(`Phase 2 완료: ${additionalRemoved}개 추가 제거됨`);
  return additionalRemoved;
};

/**
 * 전략적 셀 제거 (메인 함수)
 */
const removeRandomCellsWithStrategy = (
  board: SudokuBoard,
  solution: Grid,
  targetRemove: number,
  difficulty: Difficulty,
): number => {
  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  const strategy = getRemovalStrategy(difficulty);
  const cellsToRemove = calculateCellPriorities(strategy, targetRemove);

  const context: RemovalContext = { board, tempGrid, targetRemove, difficulty };

  const phase1Removed = executePhase1Removal(context, cellsToRemove);
  const phase2Removed = executePhase2Removal(context, cellsToRemove, phase1Removed);

  const totalRemoved = phase1Removed + phase2Removed;
  console.log(`총 ${totalRemoved}개 제거됨`);

  return totalRemoved;
};

/**
 * 강제 추가 제거 (최적화)
 */
const forceRemoveAdditionalCells = (board: SudokuBoard, additionalCount: number): number => {
  const availableCells: GridPosition[] = [];

  // 한 번의 순회로 가능한 셀들 수집
  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value !== null) {
        availableCells.push([rowIdx, colIdx]);
      }
    });
  });

  shuffleArray(availableCells);

  const toRemove = Math.min(additionalCount, availableCells.length);
  for (let i = 0; i < toRemove; i++) {
    const [row, col] = availableCells[i];
    board[row][col].value = null;
    board[row][col].isInitial = false;
  }

  return toRemove;
};

// ============================================================================
// 메인 보드 생성 함수
// ============================================================================

/**
 * 일반 스도쿠 보드 생성 (최적화된 메인 함수)
 */
export const generateBoard = (solution: Grid, difficulty: Difficulty): SudokuBoard => {
  const board = createInitialBoard(solution);
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const targetHints = min + Math.floor(Math.random() * (max - min + 1));
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  console.log(`일반 스도쿠: 난이도 ${difficulty}, 목표 힌트: ${targetHints}개, 목표 제거: ${targetRemove}개`);

  const removed = removeRandomCellsWithStrategy(board, solution, targetRemove, difficulty);
  const finalHints = SUDOKU_CELL_COUNT - removed;

  console.log(`일반 스도쿠: 실제 제거: ${removed}개, 최종 힌트: ${finalHints}개`);

  // 목표 미달시 강제 제거
  if (removed < targetRemove - 5) {
    console.log(`목표 미달로 강제 제거 시작: 추가로 ${targetRemove - removed}개 제거`);
    const additionalRemoved = forceRemoveAdditionalCells(board, targetRemove - removed);
    console.log(`강제 제거 완료: ${additionalRemoved}개 추가 제거`);
  }

  return board;
};

// ============================================================================
// 킬러 스도쿠 관련 함수들
// ============================================================================

/**
 * 케이지 맵 생성 (순수 함수)
 */
const createCageMap = (cages: KillerCage[]): Map<string, KillerCage> => {
  const cageMap = new Map<string, KillerCage>();
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });
  return cageMap;
};

/**
 * 보존해야 할 셀들 계산 (순수 함수)
 */
const calculateMustKeepCells = (cages: KillerCage[], difficulty: Difficulty): Set<string> => {
  const mustKeepCells = new Set<string>();
  const processedCages = new Set<string>();

  for (const cage of cages) {
    if (processedCages.has(String(cage.id))) continue;
    processedCages.add(String(cage.id));

    if (cage.cells.length > 1) {
      const keepCount =
        difficulty === "expert"
          ? Math.max(0, Math.floor(cage.cells.length / 4))
          : Math.max(1, Math.floor(cage.cells.length / 3));

      const shuffledCells = [...cage.cells];
      shuffleArray(shuffledCells);

      for (let i = 0; i < keepCount && i < shuffledCells.length; i++) {
        const [r, c] = shuffledCells[i];
        mustKeepCells.add(`${r}-${c}`);
      }
    }
  }

  return mustKeepCells;
};

/**
 * 킬러 셀 우선순위 계산 (순수 함수)
 */
const calculateKillerCellPriority = (
  row: number,
  col: number,
  cageMap: Map<string, KillerCage>,
  board: SudokuBoard,
): number => {
  let priority = Math.random();
  const key = `${row}-${col}`;

  const cage = cageMap.get(key);
  if (cage) {
    priority += cage.cells.length * 0.1;

    const removedInCage = cage.cells.filter(([r, c]) => board[r][c].value === null).length;
    const remainingInCage = cage.cells.length - removedInCage;

    if (remainingInCage <= 1) {
      priority -= 0.3;
    }
  }

  priority += getCenterDistance(row, col) * 0.05;

  return priority;
};

/**
 * 제거 가능한 킬러 셀들 찾기 (순수 함수)
 */
const findRemovableKillerCells = (
  board: SudokuBoard,
  cageMap: Map<string, KillerCage>,
  mustKeepCells: Set<string>,
): CellPriority[] => {
  const removableCells: CellPriority[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row}-${col}`;

      if (mustKeepCells.has(key) || board[row][col].value === null) continue;

      const priority = calculateKillerCellPriority(row, col, cageMap, board);
      removableCells.push({ pos: [row, col], priority });
    }
  }

  return removableCells.sort((a, b) => b.priority - a.priority);
};

/**
 * 킬러 스도쿠 셀 제거 유효성 검증 (Expert용)
 */
const isKillerRemovalValidLenient = (board: SudokuBoard, cages: KillerCage[], removedPos: GridPosition): boolean => {
  const [removedRow, removedCol] = removedPos;
  const targetCage = cages.find((cage) => cage.cells.some(([r, c]) => r === removedRow && c === removedCol));

  if (!targetCage) return false;

  const remainingCells = targetCage.cells.filter(([r, c]) => board[r][c].value !== null);

  if (remainingCells.length === 0) return true; // Expert에서는 빈 케이지 허용

  const currentSum = remainingCells.reduce((sum, [r, c]) => sum + (board[r][c].value || 0), 0);
  if (currentSum > targetCage.sum) return false;

  const values = remainingCells.map(([r, c]) => board[r][c].value).filter((v) => v !== null);
  const uniqueValues = new Set(values);

  return values.length === uniqueValues.size;
};

/**
 * 킬러 스도쿠 셀 제거 유효성 검증 (일반용)
 */
const isKillerRemovalValid = (board: SudokuBoard, cages: KillerCage[], removedPos: GridPosition): boolean => {
  const [removedRow, removedCol] = removedPos;
  const targetCage = cages.find((cage) => cage.cells.some(([r, c]) => r === removedRow && c === removedCol));

  if (!targetCage) return false;

  const remainingCells = targetCage.cells.filter(([r, c]) => board[r][c].value !== null);

  if (remainingCells.length === 0) return false;

  const currentSum = remainingCells.reduce((sum, [r, c]) => sum + (board[r][c].value || 0), 0);
  if (currentSum > targetCage.sum) return false;

  const values = remainingCells.map(([r, c]) => board[r][c].value).filter((v) => v !== null);
  const uniqueValues = new Set(values);

  return values.length === uniqueValues.size;
};

/**
 * 배치 단위 킬러 셀 제거
 */
const processBatchKillerRemoval = (
  board: SudokuBoard,
  cageMap: Map<string, KillerCage>,
  batchSize: number,
  difficulty: Difficulty,
  cages: KillerCage[],
): number => {
  const mustKeepCells = calculateMustKeepCells(cages, difficulty);
  const removableCells = findRemovableKillerCells(board, cageMap, mustKeepCells);
  let batchRemoved = 0;

  const cellsToTry = Math.min(removableCells.length, batchSize);

  for (let i = 0; i < cellsToTry; i++) {
    const { pos } = removableCells[i];
    const [row, col] = pos;

    if (board[row][col].value === null) continue;

    const originalValue = board[row][col].value;
    board[row][col].value = null;
    board[row][col].isInitial = false;

    const isValid =
      difficulty === "expert"
        ? isKillerRemovalValidLenient(board, cages, [row, col])
        : isKillerRemovalValid(board, cages, [row, col]);

    if (isValid) {
      batchRemoved++;
    } else {
      board[row][col].value = originalValue;
      board[row][col].isInitial = true;
    }
  }

  return batchRemoved;
};

/**
 * 킬러 스도쿠 셀 제거 (최적화)
 */
const removeKillerCellsOptimized = (
  board: SudokuBoard,
  cages: KillerCage[],
  targetRemove: number,
  difficulty: Difficulty,
): number => {
  const cageMap = createCageMap(cages);
  let removedCount = 0;
  const maxAttempts = difficulty === "expert" ? 50 : MAX_REMOVAL_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts && removedCount < targetRemove; attempt++) {
    const batchSize = Math.min(10, targetRemove - removedCount);
    const attemptRemoved = processBatchKillerRemoval(board, cageMap, batchSize, difficulty, cages);
    removedCount += attemptRemoved;

    if (attemptRemoved === 0) break;
  }

  return removedCount;
};

/**
 * 케이지 유효성 검증 (순수 함수)
 */
const validateCages = (cages: KillerCage[], solution: Grid): boolean =>
  cages.every((cage) => {
    const values = cage.cells.map(([r, c]) => solution[r][c]);
    const uniqueValues = new Set(values);
    const actualSum = values.reduce((sum, val) => sum + val, 0);

    if (values.length !== uniqueValues.size) {
      console.error(`케이지 ${cage.id}에 중복 숫자:`, values);
      return false;
    }

    if (actualSum !== cage.sum) {
      console.error(`케이지 ${cage.id} 합 불일치: ${actualSum} !== ${cage.sum}`);
      return false;
    }

    return true;
  });

/**
 * 킬러 스도쿠 보드 생성 (메인 함수)
 */
export function generateKillerBoard(
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } {
  console.log(`킬러 스도쿠 생성 시작: 난이도 ${difficulty}`);

  const board = createInitialBoard(solution);
  const cages = generateKillerCages(solution, difficulty);

  if (!validateCages(cages, solution)) {
    throw new Error("킬러 스도쿠 케이지 생성 실패");
  }

  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  const targetHints = difficulty === "expert" ? Math.max(MIN_EXPERT_HINTS, hintsKeep) : hintsKeep;
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  console.log(`킬러 스도쿠: 목표 힌트 ${targetHints}개, 목표 제거: ${targetRemove}개`);

  const removed = removeKillerCellsOptimized(board, cages, targetRemove, difficulty);
  const finalHints = SUDOKU_CELL_COUNT - removed;

  console.log(`킬러 스도쿠: 실제 제거 ${removed}개, 최종 힌트 ${finalHints}개`);

  return { board, cages };
}

// ============================================================================
// 힌트 기능
// ============================================================================

/**
 * 힌트 제공 (최적화)
 */
export function getHint(board: SudokuBoard, solution: Grid): { row: number; col: number; value: number } | null {
  const emptyCells: GridPosition[] = [];

  board.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      if (cell.value === null) {
        emptyCells.push([rowIdx, colIdx]);
      }
    });
  });

  if (emptyCells.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  const [row, col] = emptyCells[randomIndex];

  return { row, col, value: solution[row][col] };
}
