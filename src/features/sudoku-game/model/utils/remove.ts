import { BOARD_SIZE, MAX_REMOVAL_ATTEMPTS } from "@entities/board/model/constants";
import {
  CellPriority,
  Grid,
  RemovalStrategy,
  SudokuBoard,
} from "@entities/board/model/types";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  hasUniqueSolution,
  isKillerRemovalValid,
  isKillerRemovalValidLenient,
} from "./validator";
import {
  calculateCellPriorities,
  calculateKillerCellPriority,
  calculateMustKeepCells,
} from "./calculate";

/**
 * @description 난이도별 제거 전략 반환
 * @param {Difficulty} difficulty - 난이도
 * @returns {RemovalStrategy} 제거 전략
 */
function getRemovalStrategy(
  difficulty: Difficulty,
): RemovalStrategy {
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
 * @description 유일해를 보장하면서 전략적으로 셀 제거
 * @param {SudokuBoard} board - 보드
 * @param {Grid} solution - 솔루션 그리드
 * @param {number} targetRemove - 제거할 셀 수
 * @param {Difficulty} difficulty - 난이도
 * @returns {number} 제거된 셀 수
 */
export function removeRandomCellsWithStrategy(
  board: SudokuBoard,
  solution: Grid,
  targetRemove: number,
  difficulty: Difficulty,
): number {
  const strategy = getRemovalStrategy(difficulty);
  const cellsToRemove = calculateCellPriorities(
    strategy,
    targetRemove,
  );

  const tempGrid: (number | null)[][] = solution.map(
    (row) => [...row],
  );
  let removedCount = 0;

  for (const { pos } of cellsToRemove) {
    if (removedCount >= targetRemove) break;

    const [row, col] = pos;
    if (tempGrid[row][col] === null) continue;

    const originalValue = tempGrid[row][col];
    tempGrid[row][col] = null;

    if (hasUniqueSolution(tempGrid)) {
      board[row][col].value = null;
      board[row][col].isInitial = false;
      removedCount++;
    } else {
      tempGrid[row][col] = originalValue;
    }
  }

  return removedCount;
}

/**
 * @description 킬러모드 케이지 맵 생성
 * @param {KillerCage[]} cages - 케이지 배열
 * @returns {Map<string, KillerCage>} 케이지 맵
 */
function createCageMap(
  cages: KillerCage[],
): Map<string, KillerCage> {
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

      if (
        mustKeepCells.has(key) ||
        board[row][col].value === null
      ) {
        continue;
      }

      const priority = calculateKillerCellPriority(
        row, col, cageMap, board,
      );
      removableCells.push({ pos: [row, col], priority });
    }
  }

  return removableCells.sort(
    (a, b) => b.priority - a.priority,
  );
}

/**
 * @description 배치 단위 킬러 셀 제거
 */
function processBatchKillerRemoval(
  board: SudokuBoard,
  cageMap: Map<string, KillerCage>,
  batchSize: number,
  difficulty: Difficulty,
  cages: KillerCage[],
): number {
  const mustKeepCells = calculateMustKeepCells(
    cages, difficulty,
  );
  const removableCells = findRemovableKillerCells(
    board, cageMap, mustKeepCells,
  );
  let batchRemoved = 0;

  const cellsToTry = Math.min(
    removableCells.length, batchSize,
  );

  for (let i = 0; i < cellsToTry; i++) {
    const { pos } = removableCells[i];
    const [row, col] = pos;

    if (board[row][col].value === null) continue;

    const originalValue = board[row][col].value;
    board[row][col].value = null;
    board[row][col].isInitial = false;

    const validate = difficulty === "expert"
      ? isKillerRemovalValidLenient
      : isKillerRemovalValid;
    const isValid = validate(board, cages, [row, col]);

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
 */
export function removeKillerCells(
  board: SudokuBoard,
  cages: KillerCage[],
  targetRemove: number,
  difficulty: Difficulty,
): number {
  const cageMap = createCageMap(cages);
  let removedCount = 0;
  const maxAttempts = difficulty === "expert"
    ? 50
    : MAX_REMOVAL_ATTEMPTS;

  for (
    let attempt = 1;
    attempt <= maxAttempts && removedCount < targetRemove;
    attempt++
  ) {
    const batchSize = Math.min(
      10, targetRemove - removedCount,
    );
    const attemptRemoved = processBatchKillerRemoval(
      board, cageMap, batchSize, difficulty, cages,
    );
    removedCount += attemptRemoved;

    if (attemptRemoved === 0) break;
  }

  return removedCount;
}
