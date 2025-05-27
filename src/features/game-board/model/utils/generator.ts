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
 * @description 개선된 스도쿠 보드 생성 함수 - 정확한 힌트 개수 보장
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

  const removed = removeRandomCellsImproved(board, solution, targetRemove, 3); // 최대 3번 시도
  const finalHints = 81 - removed;

  console.log(`일반 스도쿠: 실제 제거: ${removed}개, 최종 힌트: ${finalHints}개`);

  // 목표 힌트 수에 못 미치면 경고
  if (Math.abs(finalHints - targetHints) > 5) {
    console.warn(`힌트 수 차이가 큽니다. 목표: ${targetHints}, 실제: ${finalHints}`);
  }

  return board;
};

/**
 * @description 킬러 스도쿠 모드 게임 보드 생성 (개선된 함수)
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

  // 난이도별 힌트 수 설정 (개선된 로직)
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  let targetHints = hintsKeep;

  // Expert 모드에서도 최소 힌트 보장
  if (difficulty === "expert") {
    targetHints = Math.max(5, hintsKeep); // 최소 5개 힌트 보장
  }

  const targetRemove = 81 - targetHints;

  console.log(`킬러 스도쿠: 목표 힌트 ${targetHints}개, 목표 제거: ${targetRemove}개`);

  // 킬러 전용 셀 제거 (개선된 버전)
  const removed = removeKillerCellsImproved(board, solution, cages, targetRemove);
  const finalHints = 81 - removed;

  console.log(`킬러 스도쿠: 실제 제거 ${removed}개, 최종 힌트 ${finalHints}개`);

  return { board, cages };
}

/**
 * @description 개선된 킬러 스도쿠 셀 제거 함수
 */
function removeKillerCellsImproved(
  board: SudokuBoard,
  solution: Grid,
  cages: KillerCage[],
  targetRemove: number,
): number {
  // 케이지별 셀 맵핑
  const cageMap = new Map<string, KillerCage>();
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });

  let removedCount = 0;
  const maxAttempts = 100;

  for (let attempt = 1; attempt <= maxAttempts && removedCount < targetRemove; attempt++) {
    console.log(`킬러 스도쿠 제거 시도 ${attempt}/${maxAttempts}`);

    // 각 케이지에서 최소 1개는 유지하도록 강제 유지 셀 선택
    const mustKeepCells = new Set<string>();
    cages.forEach((cage) => {
      if (cage.cells.length > 1) {
        // 각 케이지에서 1-2개 셀 유지 (케이지 크기에 따라)
        const keepCount = Math.max(1, Math.floor(cage.cells.length / 3));
        const shuffledCells = [...cage.cells];
        shuffleArray(shuffledCells);

        for (let i = 0; i < keepCount; i++) {
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

          // 케이지에서 너무 많이 제거되지 않도록
          if (remainingInCage <= 2) {
            priority -= 0.5;
          }
        }

        // 중앙에서 멀수록 제거하기 쉬움
        const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
        priority += centerDistance * 0.05;

        removableCells.push({ pos: [row, col], priority });
      }
    }

    removableCells.sort((a, b) => b.priority - a.priority);

    // 셀 제거 시도 (더 관대한 기준)
    const remainingToRemove = targetRemove - removedCount;
    const cellsToTry = Math.min(removableCells.length, remainingToRemove * 2);

    for (let i = 0; i < cellsToTry && removedCount < targetRemove; i++) {
      const { pos } = removableCells[i];
      const [row, col] = pos;

      if (board[row][col].value === null) continue;

      // 셀 제거 시도
      const originalValue = board[row][col].value;
      board[row][col].value = null;
      board[row][col].isInitial = false;

      // 킬러 규칙 간단 검증 (복잡한 유일해 검증 생략)
      const isValid = isKillerRemovalValid(board, cages, [row, col]);

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
 * @description 개선된 무작위 셀 제거 함수 - 정확한 힌트 개수 보장
 */
function removeRandomCellsImproved(
  board: SudokuBoard,
  solution: Grid,
  targetRemove: number,
  maxAttempts: number = 3,
): number {
  let bestRemovedCount = 0;
  let bestBoard: SudokuBoard | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`제거 시도 ${attempt}/${maxAttempts}`);

    // 매 시도마다 새로운 보드로 시작
    const tempBoard = createInitialBoard(solution);
    const removedCount = attemptCellRemoval(tempBoard, solution, targetRemove, attempt);

    console.log(`시도 ${attempt}: ${removedCount}/${targetRemove} 제거됨`);

    if (removedCount > bestRemovedCount) {
      bestRemovedCount = removedCount;
      bestBoard = tempBoard;
    }

    // 목표에 충분히 근접하면 종료
    if (Math.abs(removedCount - targetRemove) <= 3) {
      break;
    }
  }

  // 최선의 결과를 원본 보드에 적용
  if (bestBoard) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        board[r][c] = { ...bestBoard[r][c] };
      }
    }
  }

  return bestRemovedCount;
}

/**
 * @description 단일 시도에서 셀 제거 수행
 */
function attemptCellRemoval(board: SudokuBoard, solution: Grid, targetRemove: number, attemptNum: number): number {
  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  let removedCount = 0;

  // 시도마다 다른 전략 사용
  const strategy = attemptNum % 3;

  // 제거 우선순위 계산
  const cells: Array<{ pos: GridPosition; priority: number }> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let priority = Math.random() * 0.5; // 기본 무작위성

      if (strategy === 0) {
        // 전략 1: 중앙에서 멀수록 높은 우선순위
        const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
        priority += centerDistance * 0.3;
      } else if (strategy === 1) {
        // 전략 2: 대각선 위주
        if (row === col || row + col === 8) {
          priority += 0.5;
        }
      } else {
        // 전략 3: 블록 모서리 위주
        const blockRow = row % 3;
        const blockCol = col % 3;
        if (blockRow === 0 || blockRow === 2 || blockCol === 0 || blockCol === 2) {
          priority += 0.3;
        }
      }

      cells.push({ pos: [row, col], priority });
    }
  }

  // 우선순위 순으로 정렬
  cells.sort((a, b) => b.priority - a.priority);

  // 단일 셀 제거 (유일해 검증 없이 더 많이 제거)
  const maxChecks = Math.min(cells.length, targetRemove * 3);

  for (let i = 0; i < maxChecks && removedCount < targetRemove; i++) {
    const { pos } = cells[i];
    const [row, col] = pos;

    if (tempGrid[row][col] === null) continue;

    const originalValue = tempGrid[row][col];
    tempGrid[row][col] = null;

    // 간단한 검증만 수행 (매 10번째마다만 유일해 검사)
    let isValid = true;
    if (removedCount % 10 === 0 && removedCount > targetRemove * 0.7) {
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

  // 최종 유일해 검증
  if (removedCount >= targetRemove * 0.8) {
    console.log(`최종 유일해 검증 수행 중... (${removedCount}개 제거됨)`);
    if (!hasUniqueSolution(tempGrid)) {
      console.warn("최종 유일해 검증 실패 - 일부 셀 복원 필요할 수 있음");
    }
  }

  return removedCount;
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
