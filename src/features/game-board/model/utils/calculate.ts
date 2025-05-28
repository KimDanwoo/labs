import { BLOCK_SIZE, BOARD_SIZE, SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { CellPriority, RemovalStrategy, SudokuBoard } from "@entities/board/model/types";
import { getCenterDistance, isCenter, isCorner, isEdge } from "@entities/board/model/utils";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import { shuffleArray } from "@features/game-board/model/utils";

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
 * @description 셀 우선순위 계산
 * @param {RemovalStrategy} strategy - 제거 전략
 * @param {number} targetRemove - 제거할 셀 수
 * @returns {CellPriority[]} 셀 우선순위
 */
export function calculateCellPriorities(strategy: RemovalStrategy, targetRemove: number): CellPriority[] {
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
 * @description 보존해야 할 셀들 계산
 * @param {KillerCage[]} cages - 케이지 배열
 * @param {Difficulty} difficulty - 난이도
 * @returns {Set<string>} 보존해야 할 셀들
 */
export function calculateMustKeepCells(cages: KillerCage[], difficulty: Difficulty): Set<string> {
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
export function calculateKillerCellPriority(
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
