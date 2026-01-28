import { BOARD_SIZE, MAX_REMOVAL_ATTEMPTS, PHASE_1_RATIO } from "@entities/board/model/constants";
import { CellPriority, GridPosition, RemovalContext, RemovalStrategy, SudokuBoard } from "@entities/board/model/types";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import { hasUniqueSolution, isKillerRemovalValid, isKillerRemovalValidLenient } from "./validator";
import { shuffleArray } from "./common";
import { calculateCellPriorities, calculateKillerCellPriority, calculateMustKeepCells } from "./calculate";

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

  return additionalRemoved;
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
 * @description 전략적 셀 제거 (메인 함수)
 * @param {SudokuBoard} board - 보드
 * @param {number} targetRemove - 제거할 셀 수
 * @param {Difficulty} difficulty - 난이도
 * @returns {number} 제거된 셀 수
 */
export function removeRandomCellsWithStrategy(
  board: SudokuBoard,
  targetRemove: number,
  difficulty: Difficulty,
): number {
  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  const strategy = getRemovalStrategy(difficulty);
  const cellsToRemove = calculateCellPriorities(strategy, targetRemove);

  const context: RemovalContext = { board, tempGrid, targetRemove, difficulty };

  const phase1Removed = executePhase1Removal(context, cellsToRemove);
  const phase2Removed = executePhase2Removal(context, cellsToRemove, phase1Removed);

  const totalRemoved = phase1Removed + phase2Removed;

  return totalRemoved;
}

/**
 * @description 킬러모드 케이지 맵 생성
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {Map<string, KillerCage>} 케이지 맵
 */
function createCageMap(cages: KillerCage[]): Map<string, KillerCage> {
  const cageMap = new Map<string, KillerCage>();
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });
  return cageMap;
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
export function removeKillerCells(
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
 * @description 강제 추가 제거
 * @param {SudokuBoard} board - 보드
 * @param {number} additionalCount - 추가 제거할 셀 수
 * @returns {number} 제거된 셀 수
 */
export function forceRemoveAdditionalCells(board: SudokuBoard, additionalCount: number): number {
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
