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
import {
  CellPriority,
  Grid,
  GridPosition,
  RemovalContext,
  RemovalStrategy,
  SudokuBoard,
} from "@entities/board/model/types";
import { deepCopyGrid, getCenterDistance, isCenter, isCorner, isEdge } from "@entities/board/model/utils";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  applyTransformations,
  generateKillerCages,
  hasUniqueSolution,
  isKillerRemovalValid,
  isKillerRemovalValidLenient,
  isValidPlacement,
  shuffleArray,
  validateBaseGrid,
  validateCages,
} from "@features/game-board/model/utils";

/**
 * @description 백트래킹을 이용한 스도쿠 생성
 * @returns {Grid} 유효한 스도쿠 그리드
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

  return deepCopyGrid(BASE_GRID);
}

/**
 * @description 솔루션 생성
 * @returns {Grid} 유효한 스도쿠 그리드
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
 * @description 초기 보드 생성
 * @param {Grid} solution - 솔루션 그리드
 * @returns {SudokuBoard} 초기 보드
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

/**
 * @description 난이도별 제거 전략 반환
 * @param {Difficulty} difficulty - 난이도
 * @returns {RemovalStrategy} 제거 전략
 */
function getRemovalStrategy(difficulty: Difficulty): RemovalStrategy {
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
}

/**
 * @description 위치별 가중치 계산
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {RemovalStrategy} strategy - 제거 전략
 * @param {number} intensityMultiplier - 강도 계수
 * @returns {number} 가중치
 */
function calculatePositionWeight(
  row: number,
  col: number,
  strategy: RemovalStrategy,
  intensityMultiplier: number,
): number {
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
}

/**
 * @description 강도별 보너스 계산
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {number} targetRemove - 제거할 셀 수
 * @param {boolean} isHighIntensity - 강도 여부
 * @param {boolean} isMediumIntensity - 강도 여부
 * @returns {number} 보너스
 */
function calculateIntensityBonus(
  row: number,
  col: number,
  targetRemove: number,
  isHighIntensity: boolean,
  isMediumIntensity: boolean,
): number {
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
}

/**
 * @description 강도 계산
 * @param {boolean} isHigh - 강도 여부
 * @param {boolean} isMiddle - 강도 여부
 * @returns {number} 강도
 */
function getIntensity(isHigh: boolean, isMiddle: boolean): number {
  if (isHigh) {
    return 1.5;
  }

  if (isMiddle) {
    return 1.2;
  }

  return 1.0;
}

/**
 * @description 셀 우선순위 계산
 * @param {RemovalStrategy} strategy - 제거 전략
 * @param {number} targetRemove - 제거할 셀 수
 * @returns {CellPriority[]} 셀 우선순위
 */
function calculateCellPriorities(strategy: RemovalStrategy, targetRemove: number): CellPriority[] {
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
}

/**
 * @description Phase 1 제거 (빠른 배치 제거)
 * @param {RemovalContext} context - 제거 컨텍스트
 * @param {CellPriority[]} cellsToRemove - 제거할 셀 우선순위
 * @returns {number} 제거된 셀 수
 */
function executePhase1Removal(context: RemovalContext, cellsToRemove: CellPriority[]): number {
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
}

/**
 * @description Phase 2 제거 (신중한 제거 with 검증)
 * @param {RemovalContext} context - 제거 컨텍스트
 * @param {CellPriority[]} cellsToRemove - 제거할 셀 우선순위
 * @param {number} phase1Removed - 제거된 셀 수
 * @returns {number} 제거된 셀 수
 */
function executePhase2Removal(context: RemovalContext, cellsToRemove: CellPriority[], phase1Removed: number): number {
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
}

/**
 * @description 전략적 셀 제거 (메인 함수)
 * @param {SudokuBoard} board - 보드
 * @param {number} targetRemove - 제거할 셀 수
 * @param {Difficulty} difficulty - 난이도
 * @returns {number} 제거된 셀 수
 */
function removeRandomCellsWithStrategy(board: SudokuBoard, targetRemove: number, difficulty: Difficulty): number {
  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  const strategy = getRemovalStrategy(difficulty);
  const cellsToRemove = calculateCellPriorities(strategy, targetRemove);

  const context: RemovalContext = { board, tempGrid, targetRemove, difficulty };

  const phase1Removed = executePhase1Removal(context, cellsToRemove);
  const phase2Removed = executePhase2Removal(context, cellsToRemove, phase1Removed);

  const totalRemoved = phase1Removed + phase2Removed;
  console.log(`총 ${totalRemoved}개 제거됨`);

  return totalRemoved;
}

/**
 * @description 강제 추가 제거 (최적화)
 * @param {SudokuBoard} board - 보드
 * @param {number} additionalCount - 추가 제거할 셀 수
 * @returns {number} 제거된 셀 수
 */
function forceRemoveAdditionalCells(board: SudokuBoard, additionalCount: number): number {
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
}

/**
 * @description 일반 스도쿠 보드 생성
 * @param {Grid} solution - 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {SudokuBoard} 보드
 */
export function generateBoard(solution: Grid, difficulty: Difficulty): SudokuBoard {
  const board = createInitialBoard(solution);
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const targetHints = min + Math.floor(Math.random() * (max - min + 1));
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  console.log(`일반 스도쿠: 난이도 ${difficulty}, 목표 힌트: ${targetHints}개, 목표 제거: ${targetRemove}개`);

  const removed = removeRandomCellsWithStrategy(board, targetRemove, difficulty);
  const finalHints = SUDOKU_CELL_COUNT - removed;

  console.log(`일반 스도쿠: 실제 제거: ${removed}개, 최종 힌트: ${finalHints}개`);

  // 목표 미달시 강제 제거
  if (removed < targetRemove - 5) {
    console.log(`목표 미달로 강제 제거 시작: 추가로 ${targetRemove - removed}개 제거`);
    const additionalRemoved = forceRemoveAdditionalCells(board, targetRemove - removed);
    console.log(`강제 제거 완료: ${additionalRemoved}개 추가 제거`);
  }

  return board;
}

/**
 * @description 케이지 맵 생성
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {Map<string, KillerCage>} 케이지 맵
 */
function createCageMap(cages: KillerCage[]): Map<string, KillerCage> {
  const cageMap = new Map<string, KillerCage>();
  console.log(cages);
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });
  console.log(cageMap);
  return cageMap;
}

/**
 * @description 보존해야 할 셀들 계산
 * @param {KillerCage[]} cages - 케이지 배열
 * @param {Difficulty} difficulty - 난이도
 * @returns {Set<string>} 보존해야 할 셀들
 */
function calculateMustKeepCells(cages: KillerCage[], difficulty: Difficulty): Set<string> {
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
}

/**
 * @description 킬러 셀 우선순위 계산
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {Map<string, KillerCage>} cageMap - 케이지 맵
 * @param {SudokuBoard} board - 보드
 * @returns {number} 우선순위
 */
function calculateKillerCellPriority(
  row: number,
  col: number,
  cageMap: Map<string, KillerCage>,
  board: SudokuBoard,
): number {
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
}

/**
 * @description 제거 가능한 킬러 셀들 찾기
 * @param {SudokuBoard} board - 보드
 * @param {Map<string, KillerCage>} cageMap - 케이지 맵
 * @param {Set<string>} mustKeepCells - 보존해야 할 셀들
 * @returns {CellPriority[]} 제거 가능한 킬러 셀들
 */
function findRemovableKillerCells(
  board: SudokuBoard,
  cageMap: Map<string, KillerCage>,
  mustKeepCells: Set<string>,
): CellPriority[] {
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
}

/**
 * @description 배치 단위 킬러 셀 제거
 * @param {SudokuBoard} board - 보드
 * @param {Map<string, KillerCage>} cageMap - 케이지 맵
 * @param {number} batchSize - 배치 크기
 * @param {Difficulty} difficulty - 난이도
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {number} 제거된 셀 수
 */
function processBatchKillerRemoval(
  board: SudokuBoard,
  cageMap: Map<string, KillerCage>,
  batchSize: number,
  difficulty: Difficulty,
  cages: KillerCage[],
): number {
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
}

/**
 * @description 킬러 스도쿠 셀 제거
 * @param {SudokuBoard} board - 보드
 * @param {KillerCage[]} cages - 케이지 배열
 * @param {number} targetRemove - 제거할 셀 수
 * @param {Difficulty} difficulty - 난이도
 * @returns {number} 제거된 셀 수
 */
function removeKillerCellsOptimized(
  board: SudokuBoard,
  cages: KillerCage[],
  targetRemove: number,
  difficulty: Difficulty,
): number {
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
}

/**
 * @description 킬러 스도쿠 보드 생성
 * @param {Grid} solution - 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {SudokuBoard} 보드
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
