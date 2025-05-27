/* eslint-disable no-console */

import { BASE_GRID, BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  applyTransformations,
  generateKillerCages,
  hasUniqueSolution,
  shuffleArray,
} from "@features/game-board/model/utils";

/**
 * @description 기본 그리드 검증
 * @param {Grid} grid - 검증할 그리드
 * @returns {boolean} 검증 결과
 */
function validateBaseGrid(grid: Grid): boolean {
  // 행 검증
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowSet = new Set(grid[row]);
    if (rowSet.size !== BOARD_SIZE || !Array.from({ length: 9 }, (_, i) => i + 1).every((n) => rowSet.has(n))) {
      console.error(`Invalid row ${row}:`, grid[row]);
      return false;
    }
  }

  // 열 검증
  for (let col = 0; col < BOARD_SIZE; col++) {
    const colSet = new Set();
    for (let row = 0; row < BOARD_SIZE; row++) {
      colSet.add(grid[row][col]);
    }
    if (colSet.size !== BOARD_SIZE || !Array.from({ length: 9 }, (_, i) => i + 1).every((n) => colSet.has(n))) {
      console.error(`Invalid column ${col}`);
      return false;
    }
  }

  // 3x3 블록 검증
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const blockSet = new Set();
      for (let r = 0; r < BLOCK_SIZE; r++) {
        for (let c = 0; c < BLOCK_SIZE; c++) {
          blockSet.add(grid[blockRow * 3 + r][blockCol * 3 + c]);
        }
      }
      if (blockSet.size !== BOARD_SIZE || !Array.from({ length: 9 }, (_, i) => i + 1).every((n) => blockSet.has(n))) {
        console.error(`Invalid block [${blockRow}, ${blockCol}]`);
        return false;
      }
    }
  }

  return true;
}

function generateValidSudoku(): Grid {
  const grid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  function fillGrid(row: number, col: number): boolean {
    if (row === 9) return true;
    if (col === 9) return fillGrid(row + 1, 0);

    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
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
  }

  function isValidPlacement(gridItem: Grid, row: number, col: number, num: number): boolean {
    // 행 검사
    for (let c = 0; c < 9; c++) {
      if (gridItem[row][c] === num) return false;
    }

    // 열 검사
    for (let r = 0; r < 9; r++) {
      if (gridItem[r][col] === num) return false;
    }

    // 블록 검사
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (gridItem[blockRow + r][blockCol + c] === num) return false;
      }
    }

    return true;
  }

  if (fillGrid(0, 0)) {
    return grid;
  }

  // 백트래킹이 실패하면 BASE_GRID 사용
  console.warn("백트래킹 생성 실패, BASE_GRID 사용");
  return structuredClone(BASE_GRID);
}

/**
 * 유효한 스도쿠 솔루션 생성
 * @returns {Grid} 완성된 스도쿠 그리드
 */
export function generateSolution(): Grid {
  // BASE_GRID 유효성 검증
  if (!validateBaseGrid(BASE_GRID)) {
    console.warn("BASE_GRID가 유효하지 않음, 새로운 그리드 생성");
    const newGrid = generateValidSudoku();
    applyTransformations(newGrid);
    return newGrid;
  }

  const solution = structuredClone(BASE_GRID);
  applyTransformations(solution);

  // 변환 후에도 유효한지 검증
  if (!validateBaseGrid(solution)) {
    console.error("변환 후 그리드가 유효하지 않음, 재생성");
    return generateValidSudoku();
  }

  return solution;
}

/**
 * @description 완성된 솔루션으로부터 초기 보드 생성
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @returns {SudokuBoard} 초기 보드
 */
export function createInitialBoard(solution: Grid): SudokuBoard {
  return Array.from({ length: BOARD_SIZE }, (_1, row) =>
    Array.from({ length: BOARD_SIZE }, (_2, col) => ({
      value: solution[row][col],
      isInitial: true,
      isSelected: false,
      isConflict: false,
      notes: [],
    })),
  );
}

/**
 * @description 개선된 스도쿠 보드 생성 함수 - 정확한 힌트 개수 보장 및 난이도별 차이 극대화
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도 설정
 * @returns {SudokuBoard} 생성된 스도쿠 보드
 */
export const generateBoard = (solution: Grid, difficulty: Difficulty): SudokuBoard => {
  const board = createInitialBoard(solution);
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const targetHints = min + Math.floor(Math.random() * (max - min + 1));
  const targetRemove = 81 - targetHints;

  console.log(`일반 스도쿠: 난이도 ${difficulty}, 목표 힌트: ${targetHints}개, 목표 제거: ${targetRemove}개`);

  // 난이도별 제거 전략 적용
  const removed = removeRandomCellsWithStrategy(board, solution, targetRemove, difficulty);
  const finalHints = 81 - removed;

  console.log(`일반 스도쿠: 실제 제거: ${removed}개, 최종 힌트: ${finalHints}개`);

  // 목표에 도달하지 못한 경우 강제 제거 (유일해 검증 없이)
  if (removed < targetRemove - 5) {
    console.log(`목표 미달로 강제 제거 시작: 추가로 ${targetRemove - removed}개 제거`);
    const additionalRemoved = forceRemoveAdditionalCells(board, targetRemove - removed);
    console.log(`강제 제거 완료: ${additionalRemoved}개 추가 제거`);
  }

  return board;
};

/**
 * @description 난이도별 전략적 셀 제거
 */
function removeRandomCellsWithStrategy(
  board: SudokuBoard,
  solution: Grid,
  targetRemove: number,
  difficulty: Difficulty,
): number {
  let removedCount = 0;
  const tempGrid = board.map((row) => row.map((cell) => cell.value));

  // 난이도별 제거 전략 설정
  const strategy = getDifficultyStrategy(difficulty);

  // 제거할 셀들을 전략에 따라 우선순위 정렬
  const cellsToRemove = generateRemovalOrder(strategy, targetRemove);

  // 단계별 제거 (처음에는 유일해 검증 없이 대량 제거)
  const phase1Target = Math.floor(targetRemove * 0.7); // 70%는 빠르게 제거
  const phase2Target = targetRemove - phase1Target; // 30%는 신중하게 제거

  console.log(`Phase 1: ${phase1Target}개 빠른 제거, Phase 2: ${phase2Target}개 신중한 제거`);

  // Phase 1: 빠른 제거 (유일해 검증 생략)
  for (let i = 0; i < cellsToRemove.length && removedCount < phase1Target; i++) {
    const { pos } = cellsToRemove[i];
    const [row, col] = pos;

    if (tempGrid[row][col] === null) continue;

    tempGrid[row][col] = null;
    board[row][col].value = null;
    board[row][col].isInitial = false;
    removedCount++;
  }

  console.log(`Phase 1 완료: ${removedCount}개 제거됨`);

  // Phase 2: 신중한 제거 (유일해 검증 포함)
  for (let i = phase1Target; i < cellsToRemove.length && removedCount < targetRemove; i++) {
    const { pos } = cellsToRemove[i];
    const [row, col] = pos;

    if (tempGrid[row][col] === null) continue;

    const originalValue = tempGrid[row][col];
    tempGrid[row][col] = null;

    // 어려운 난이도에서는 더 관대한 유일해 검증
    const needsStrictValidation = difficulty === "easy" || difficulty === "medium";
    let isValid = true;

    if (needsStrictValidation && removedCount % 5 === 0) {
      isValid = hasUniqueSolution(tempGrid);
    }

    if (isValid) {
      board[row][col].value = null;
      board[row][col].isInitial = false;
      removedCount++;
    } else {
      tempGrid[row][col] = originalValue;
    }
  }

  console.log(`Phase 2 완료: 총 ${removedCount}개 제거됨`);

  return removedCount;
}

/**
 * @description 난이도별 제거 전략 타입 정의
 */
interface RemovalStrategy {
  preferCenter: boolean;
  preferCorners: boolean;
  preferEdges: boolean;
  symmetryBonus: number;
  blockDistribution: boolean;
}

/**
 * @description 난이도별 제거 전략 반환
 */
function getDifficultyStrategy(difficulty: Difficulty): RemovalStrategy {
  if (difficulty === "easy") {
    return {
      preferCenter: false,
      preferCorners: true,
      preferEdges: true,
      symmetryBonus: 0.3,
      blockDistribution: true,
    };
  }
  if (difficulty === "medium") {
    return {
      preferCenter: false,
      preferCorners: false,
      preferEdges: true,
      symmetryBonus: 0.2,
      blockDistribution: true,
    };
  }
  if (difficulty === "hard") {
    return {
      preferCenter: true,
      preferCorners: false,
      preferEdges: false,
      symmetryBonus: 0.1,
      blockDistribution: false,
    };
  }
  if (difficulty === "expert") {
    return {
      preferCenter: true,
      preferCorners: true,
      preferEdges: false,
      symmetryBonus: 0,
      blockDistribution: false,
    };
  }
  return {
    preferCenter: false,
    preferCorners: false,
    preferEdges: false,
    symmetryBonus: 0,
    blockDistribution: false,
  };
}

/**
 * @description 제거 순서 생성 (targetRemove를 활용한 적응적 전략)
 */
function generateRemovalOrder(
  strategy: RemovalStrategy,
  targetRemove: number,
): Array<{ pos: GridPosition; priority: number }> {
  const cells: Array<{ pos: GridPosition; priority: number }> = [];

  // targetRemove에 따른 제거 강도 계산
  const removalIntensity = targetRemove / 81; // 0~1 사이 값
  const isHighIntensity = removalIntensity > 0.6; // 60% 이상 제거시 고강도
  const isMediumIntensity = removalIntensity > 0.4; // 40% 이상 제거시 중강도

  console.log(`제거 강도: ${(removalIntensity * 100).toFixed(1)}% (${targetRemove}/81개)`);

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // targetRemove에 따라 기본 무작위성 조정
      let priority = Math.random() * (isHighIntensity ? 0.2 : 0.3);

      // 위치별 가중치
      const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
      const isCorner = (row === 0 || row === 8) && (col === 0 || col === 8);
      const isEdge = row === 0 || row === 8 || col === 0 || col === 8;
      const isCenter = centerDistance <= 2;

      // targetRemove가 클수록 더 공격적인 제거
      let intensityMultiplier = 1.0;
      if (isHighIntensity) {
        intensityMultiplier = 1.5;
      } else if (isMediumIntensity) {
        intensityMultiplier = 1.2;
      }

      if (strategy.preferCenter && isCenter) {
        priority += 0.4 * intensityMultiplier;
      }
      if (strategy.preferCorners && isCorner) {
        priority += 0.3 * intensityMultiplier;
      }
      if (strategy.preferEdges && isEdge && !isCorner) {
        priority += 0.2 * intensityMultiplier;
      }

      // 대칭성 보너스 (고강도일 때 대칭성보다 효율성 우선)
      if (strategy.symmetryBonus > 0 && !isHighIntensity) {
        const symmetricRow = 8 - row;
        const symmetricCol = 8 - col;
        if (row !== symmetricRow || col !== symmetricCol) {
          priority += strategy.symmetryBonus;
        }
      }

      // 블록 분산 보너스
      if (strategy.blockDistribution) {
        const blockId = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        priority += (blockId % 3) * 0.1;
      }

      // targetRemove가 클 때 추가 가중치
      if (isHighIntensity) {
        // 고강도 제거시 중앙 집중도 증가
        if (centerDistance <= 3) {
          priority += 0.2;
        }
        // 모든 셀에 기본 제거 보너스
        priority += 0.3;
      } else if (isMediumIntensity) {
        // 중강도 제거시 균형잡힌 제거
        if (centerDistance <= 2) {
          priority += 0.1;
        }
        priority += 0.15;
      }

      // 제거 패턴 다양화 (targetRemove에 따라)
      if (targetRemove > 50) {
        // 매우 많이 제거할 때는 체크보드 패턴 선호
        if ((row + col) % 2 === 0) {
          priority += 0.1;
        }
      }

      cells.push({ pos: [row, col], priority });
    }
  }

  // 우선순위 순으로 정렬
  cells.sort((a, b) => b.priority - a.priority);

  // targetRemove보다 조금 더 많은 후보 준비 (백업용)
  const candidateCount = Math.min(cells.length, Math.floor(targetRemove * 1.5));
  return cells.slice(0, candidateCount);
}

/**
 * @description 목표에 못 미친 경우 강제 제거
 */
function forceRemoveAdditionalCells(board: SudokuBoard, additionalCount: number): number {
  let removed = 0;
  const availableCells: GridPosition[] = [];

  // 제거 가능한 셀들 찾기
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].value !== null) {
        availableCells.push([row, col]);
      }
    }
  }

  shuffleArray(availableCells);

  // 강제 제거 (유일해 검증 없이)
  for (let i = 0; i < Math.min(additionalCount, availableCells.length); i++) {
    const [row, col] = availableCells[i];
    board[row][col].value = null;
    board[row][col].isInitial = false;
    removed++;
  }

  return removed;
}

/**
 * @description 킬러 스도쿠 모드 게임 보드 생성 (Expert 모드 수정)
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {{ board: SudokuBoard, cages: KillerCage[] }} 생성된 킬러 스도쿠 보드
 */
export function generateKillerBoard(
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } {
  console.log(`킬러 스도쿠 생성 시작: 난이도 ${difficulty}`);

  // 기본 보드 생성
  const board = createInitialBoard(solution);

  // 케이지 생성
  const cages = generateKillerCages(solution, difficulty);

  // 케이지 유효성 검증
  if (!validateCages(cages, solution)) {
    throw new Error("킬러 스도쿠 케이지 생성 실패");
  }

  // 난이도별 힌트 수 설정 (Expert 모드 개선)
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  let targetHints = hintsKeep;

  // Expert 모드에서 최소 힌트 보장 (완전히 빈 보드가 아니도록)
  if (difficulty === "expert") {
    targetHints = Math.max(8, hintsKeep); // 최소 8개 힌트 보장 (각 블록당 거의 1개)
  }

  const targetRemove = 81 - targetHints;

  console.log(`킬러 스도쿠: 목표 힌트 ${targetHints}개, 목표 제거: ${targetRemove}개`);

  // 킬러 전용 셀 제거 (개선된 버전)
  const removed = removeKillerCellsImproved(board, solution, cages, targetRemove, difficulty);
  const finalHints = 81 - removed;

  console.log(`킬러 스도쿠: 실제 제거 ${removed}개, 최종 힌트 ${finalHints}개`);

  return { board, cages };
}

/**
 * @description 개선된 킬러 스도쿠 셀 제거 함수 (Expert 모드 개선)
 */
function removeKillerCellsImproved(
  board: SudokuBoard,
  solution: Grid,
  cages: KillerCage[],
  targetRemove: number,
  difficulty: Difficulty,
): number {
  // 케이지별 셀 맵핑
  const cageMap = new Map<string, KillerCage>();
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });

  let removedCount = 0;
  const maxAttempts = difficulty === "expert" ? 50 : 100; // Expert는 더 적은 시도

  for (let attempt = 1; attempt <= maxAttempts && removedCount < targetRemove; attempt++) {
    console.log(`킬러 스도쿠 제거 시도 ${attempt}/${maxAttempts}`);

    // Expert 모드에서는 더 관대한 유지 정책
    const mustKeepCells = new Set<string>();
    cages.forEach((cage) => {
      if (cage.cells.length > 1) {
        // Expert에서는 각 케이지당 유지할 셀을 줄임
        const keepCount =
          difficulty === "expert"
            ? Math.max(0, Math.floor(cage.cells.length / 4)) // Expert: 4분의 1만 유지
            : Math.max(1, Math.floor(cage.cells.length / 3)); // 다른 난이도: 3분의 1 유지

        const shuffledCells = [...cage.cells];
        shuffleArray(shuffledCells);

        for (let i = 0; i < keepCount && i < shuffledCells.length; i++) {
          const [r, c] = shuffledCells[i];
          mustKeepCells.add(`${r}-${c}`);
        }
      }
    });

    // 제거 가능한 셀들을 우선순위 순으로 정렬
    const removableCells: Array<{ pos: GridPosition; priority: number }> = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const key = `${row}-${col}`;

        if (mustKeepCells.has(key) || board[row][col].value === null) continue;

        let priority = Math.random(); // 기본 무작위성

        const cage = cageMap.get(key);
        if (cage) {
          // 케이지 크기가 클수록 제거하기 쉬움
          priority += cage.cells.length * 0.1;

          // 케이지 내 이미 제거된 셀 수 고려
          const removedInCage = cage.cells.filter(([r, c]) => board[r][c].value === null).length;
          const remainingInCage = cage.cells.length - removedInCage;

          // Expert 모드에서는 더 관대하게
          const minRemaining = difficulty === "expert" ? 0 : 1;
          if (remainingInCage <= minRemaining) {
            priority -= 0.3; // Expert에서는 패널티 감소
          }
        }

        // 중앙에서 멀수록 제거하기 쉬움
        const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
        priority += centerDistance * 0.05;

        removableCells.push({ pos: [row, col], priority });
      }
    }

    removableCells.sort((a, b) => b.priority - a.priority);

    // 셀 제거 시도 (Expert에서는 더 관대한 기준)
    const remainingToRemove = targetRemove - removedCount;
    const cellsToTry = Math.min(removableCells.length, remainingToRemove * (difficulty === "expert" ? 3 : 2));

    for (let i = 0; i < cellsToTry && removedCount < targetRemove; i++) {
      const { pos } = removableCells[i];
      const [row, col] = pos;

      if (board[row][col].value === null) continue;

      // 셀 제거 시도
      const originalValue = board[row][col].value;
      board[row][col].value = null;
      board[row][col].isInitial = false;

      // Expert 모드에서는 더 관대한 검증
      const isValid =
        difficulty === "expert"
          ? isKillerRemovalValidLenient(board, cages, [row, col])
          : isKillerRemovalValid(board, cages, [row, col]);

      if (isValid) {
        removedCount++;
      } else {
        // 제거 실패 - 복원
        board[row][col].value = originalValue;
        board[row][col].isInitial = true;
      }
    }

    console.log(`시도 ${attempt} 완료: ${removedCount}/${targetRemove} 제거됨`);
  }

  return removedCount;
}

/**
 * @description Expert 모드용 관대한 킬러 스도쿠 셀 제거 유효성 검증
 */
function isKillerRemovalValidLenient(board: SudokuBoard, cages: KillerCage[], removedPos: GridPosition): boolean {
  const [removedRow, removedCol] = removedPos;

  // 제거된 셀이 속한 케이지 찾기
  const targetCage = cages.find((cage) => cage.cells.some(([r, c]) => r === removedRow && c === removedCol));

  if (!targetCage) return false;

  // 케이지 내 남은 셀 수 확인 (Expert에서는 0개도 허용)
  const remainingCells = targetCage.cells.filter(([r, c]) => board[r][c].value !== null);

  // 케이지가 완전히 비워져도 허용 (Expert 모드)
  if (remainingCells.length === 0) return true;

  // 케이지 합계 검증 (현재 채워진 값들의 합이 목표보다 작거나 같아야 함)
  const currentSum = remainingCells.reduce((sum, [r, c]) => sum + (board[r][c].value || 0), 0);
  if (currentSum > targetCage.sum) return false;

  // 케이지 내 중복 값 검사
  const values = remainingCells.map(([r, c]) => board[r][c].value).filter((v) => v !== null);
  const uniqueValues = new Set(values);
  if (values.length !== uniqueValues.size) return false;

  return true;
}

/**
 * @description 킬러 스도쿠 셀 제거 유효성 간단 검증
 */
function isKillerRemovalValid(board: SudokuBoard, cages: KillerCage[], removedPos: GridPosition): boolean {
  const [removedRow, removedCol] = removedPos;

  // 제거된 셀이 속한 케이지 찾기
  const targetCage = cages.find((cage) => cage.cells.some(([r, c]) => r === removedRow && c === removedCol));

  if (!targetCage) return false;

  // 케이지 내 남은 셀 수 확인
  const remainingCells = targetCage.cells.filter(([r, c]) => board[r][c].value !== null);

  // 최소 1개는 남아있어야 함
  if (remainingCells.length === 0) return false;

  // 케이지 합계 검증 (현재 채워진 값들의 합이 목표보다 작거나 같아야 함)
  const currentSum = remainingCells.reduce((sum, [r, c]) => sum + (board[r][c].value || 0), 0);
  if (currentSum > targetCage.sum) return false;

  // 케이지 내 중복 값 검사
  const values = remainingCells.map(([r, c]) => board[r][c].value).filter((v) => v !== null);
  const uniqueValues = new Set(values);
  if (values.length !== uniqueValues.size) return false;

  return true;
}

/**
 * @description 케이지 유효성 검증 함수
 * @param {KillerCage[]} cages - 케이지 목록
 * @param {Grid} solution - 솔루션
 * @returns {boolean} 모든 케이지가 유효한지 여부
 */
function validateCages(cages: KillerCage[], solution: Grid): boolean {
  for (const cage of cages) {
    const values = cage.cells.map(([r, c]) => solution[r][c]);
    const uniqueValues = new Set(values);

    // 중복 숫자 검사
    if (values.length !== uniqueValues.size) {
      console.error(`케이지 ${cage.id}에 중복 숫자:`, values);
      return false;
    }

    // 합계 검사
    const actualSum = values.reduce((sum, val) => sum + val, 0);
    if (actualSum !== cage.sum) {
      console.error(`케이지 ${cage.id} 합 불일치: ${actualSum} !== ${cage.sum}`);
      return false;
    }
  }

  return true;
}

/**
 * @description 힌트 제공 - 무작위 빈 셀에 정답 채우기
 * @param {SudokuBoard} board - 현재 스도쿠 보드
 * @param {Grid} solution - 정답 그리드
 * @returns {GridPosition & { value: number }} 힌트 정보
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

  return {
    row,
    col,
    value: solution[row][col],
  };
}
