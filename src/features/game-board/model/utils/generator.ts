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

function isKillerGridValid(grid: (number | null)[][], cages: KillerCage[]): boolean {
  // 각 케이지별로 검사
  for (const cage of cages) {
    const values: number[] = [];
    let sum = 0;
    let nullCount = 0;

    for (const [r, c] of cage.cells) {
      const value = grid[r][c];
      if (value === null) {
        nullCount++;
      } else {
        values.push(value);
        sum += value;
      }
    }

    // 중복 숫자 검사
    const uniqueValues = new Set(values);
    if (values.length !== uniqueValues.size) {
      return false;
    }

    // 합이 이미 초과했는지 검사
    if (sum > cage.sum) {
      return false;
    }

    // 남은 빈 칸으로 합을 맞출 수 있는지 검사
    if (nullCount > 0) {
      const remainingSum = cage.sum - sum;
      const minPossibleSum = nullCount; // 최소 1씩
      const maxPossibleSum = nullCount * 9; // 최대 9씩

      if (remainingSum < minPossibleSum || remainingSum > maxPossibleSum) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @description 개선된 스도쿠 보드 생성 함수
 * @param {Grid} solution - 완성된 스도쿠 솔루션
 * @param {Difficulty} difficulty - 난이도 설정
 * @returns {SudokuBoard} 생성된 스도쿠 보드
 */
export const generateBoard = (solution: Grid, difficulty: Difficulty): SudokuBoard => {
  const board = createInitialBoard(solution);
  const { min, max } = DIFFICULTY_RANGES[difficulty];
  const targetRemove = min + Math.floor(Math.random() * (max - min + 1));

  console.log(`일반 스도쿠: 난이도 ${difficulty}, 목표 제거: ${targetRemove}개`);

  const removed = removeRandomCellsImproved(board, solution, targetRemove);
  const finalHints = 81 - removed;

  console.log(`일반 스도쿠: 실제 제거: ${removed}개, 최종 힌트: ${finalHints}개`);

  return board;
};

function removeKillerCells(board: SudokuBoard, solution: Grid, cages: KillerCage[], targetRemove: number): number {
  // 케이지별 셀 맵핑
  const cageMap = new Map<string, KillerCage>();
  cages.forEach((cage) => {
    cage.cells.forEach(([r, c]) => {
      cageMap.set(`${r}-${c}`, cage);
    });
  });

  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  let removedCount = 0;

  // 각 케이지에서 최소 1개는 유지하도록 강제 유지 셀 선택
  const mustKeepCells = new Set<string>();
  cages.forEach((cage) => {
    if (cage.cells.length > 1) {
      // 무작위로 1개 셀 선택하여 유지
      const keepIndex = Math.floor(Math.random() * cage.cells.length);
      const [r, c] = cage.cells[keepIndex];
      mustKeepCells.add(`${r}-${c}`);
    }
  });

  // 제거 가능한 셀들을 우선순위 순으로 정렬
  const removableCells: Array<{ pos: GridPosition; priority: number }> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row}-${col}`;

      if (mustKeepCells.has(key)) continue;

      let priority = 0;
      const cage = cageMap.get(key);

      if (cage) {
        // 케이지 크기가 클수록 제거하기 쉬움
        priority += cage.cells.length * 0.2;

        // 케이지 합이 클수록 제거하기 쉬움
        priority += cage.sum * 0.01;
      }

      // 중앙에서 멀수록 제거하기 쉬움
      const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
      priority += centerDistance * 0.1;

      // 무작위성 추가
      priority += Math.random() * 0.3;

      removableCells.push({ pos: [row, col], priority });
    }
  }

  removableCells.sort((a, b) => b.priority - a.priority);

  // 셀 제거 시도
  for (const { pos } of removableCells) {
    if (removedCount >= targetRemove) break;

    const [row, col] = pos;

    if (tempGrid[row][col] === null) continue;

    const originalValue = tempGrid[row][col];
    tempGrid[row][col] = null;

    // 킬러 스도쿠 규칙 검증 (간단한 버전)
    if (isKillerGridValid(tempGrid, cages)) {
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

  // 난이도별 힌트 수 설정
  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  const targetRemove = 81 - hintsKeep;

  console.log(`킬러 스도쿠: 목표 제거 ${targetRemove}개, 유지 ${hintsKeep}개`);

  // 킬러 전용 셀 제거
  const removed = removeKillerCells(board, solution, cages, targetRemove);
  const finalHints = 81 - removed;

  console.log(`킬러 스도쿠: 실제 제거 ${removed}개, 최종 힌트 ${finalHints}개`);

  return { board, cages };
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
 * @description 개선된 무작위 셀 제거 함수
 * @param {SudokuBoard} board - 스도쿠 보드
 * @param {Grid} solution - 원본 솔루션
 * @param {number} targetRemoveCount - 제거할 셀 수
 * @param {KillerCage[]} cages - 케이지 목록 (킬러 스도쿠에만 사용)
 */
function removeRandomCellsImproved(board: SudokuBoard, solution: Grid, targetRemove: number): number {
  const tempGrid = board.map((row) => row.map((cell) => cell.value));
  let removedCount = 0;

  // 제거 우선순위 계산
  const cells: Array<{ pos: GridPosition; priority: number }> = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      let priority = 0;

      // 중앙에서 멀수록 높은 우선순위
      const centerDistance = Math.abs(4 - row) + Math.abs(4 - col);
      priority += centerDistance * 0.3;

      // 대각선 셀은 낮은 우선순위
      if (row === col || row + col === 8) {
        priority -= 0.5;
      }

      // 무작위성 추가
      priority += Math.random() * 0.5;

      cells.push({ pos: [row, col], priority });
    }
  }

  // 우선순위 순으로 정렬
  cells.sort((a, b) => b.priority - a.priority);

  // 대칭적 제거 시도
  const pairs: Array<[GridPosition, GridPosition]> = [];
  const used = new Set<string>();

  for (const { pos } of cells) {
    const [row, col] = pos;
    const key = `${row}-${col}`;

    if (used.has(key)) continue;

    // 대칭 위치 찾기
    const symmetricRow = 8 - row;
    const symmetricCol = 8 - col;
    const symmetricKey = `${symmetricRow}-${symmetricCol}`;

    if (row === symmetricRow && col === symmetricCol) {
      // 중앙 셀은 단독으로 처리
      pairs.push([
        [row, col],
        [row, col],
      ]);
    } else if (!used.has(symmetricKey)) {
      pairs.push([
        [row, col],
        [symmetricRow, symmetricCol],
      ]);
      used.add(symmetricKey);
    } else {
      pairs.push([
        [row, col],
        [row, col],
      ]);
    }

    used.add(key);
  }

  // 배치를 무작위로 섞기
  shuffleArray(pairs);

  for (const [pos1, pos2] of pairs) {
    if (removedCount >= targetRemove) break;

    const [row1, col1] = pos1;
    const [row2, col2] = pos2;

    const isSameCell = row1 === row2 && col1 === col2;

    // 첫 번째 셀 제거 시도
    if (tempGrid[row1][col1] !== null) {
      const originalValue1 = tempGrid[row1][col1];
      tempGrid[row1][col1] = null;

      let canRemoveSecond = true;
      if (!isSameCell && tempGrid[row2][col2] !== null) {
        const originalValue2 = tempGrid[row2][col2];
        tempGrid[row2][col2] = null;

        if (!hasUniqueSolution(tempGrid)) {
          tempGrid[row2][col2] = originalValue2;
          canRemoveSecond = false;
        }
      }

      if (hasUniqueSolution(tempGrid)) {
        // 제거 성공
        board[row1][col1].value = null;
        board[row1][col1].isInitial = false;
        removedCount++;

        if (!isSameCell && canRemoveSecond && tempGrid[row2][col2] === null) {
          board[row2][col2].value = null;
          board[row2][col2].isInitial = false;
          removedCount++;
        }
      } else {
        // 제거 실패 - 복원
        tempGrid[row1][col1] = originalValue1;
        if (!isSameCell && tempGrid[row2][col2] === null) {
          tempGrid[row2][col2] = solution[row2][col2];
        }
      }
    }
  }

  return removedCount;
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
