import {
  BASE_GRID,
  BOARD_SIZE,
  KEY_NUMBER,
  MIN_EXPERT_HINTS,
  SUDOKU_CELL_COUNT,
} from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { deepCopyGrid } from "@entities/board/model/utils";
import { DIFFICULTY_RANGES, KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import { applyTransformations } from "./transformer";
import { createEmptyGrid, shuffleArray } from "./common";
import { isValidPlacement, validateAllCages, validateBaseGrid, validateCages } from "./validator";
import { calculateNeighborScore } from "./calculate";
import { removeKillerCells, removeRandomCellsWithStrategy } from "./remove";

/**
 * @description 백트래킹을 이용한 스도쿠 생성
 * @returns {Grid} 유효한 스도쿠 그리드
 */
function generateValidSudoku(): Grid {
  const grid: Grid = createEmptyGrid();

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
    const newGrid = generateValidSudoku();
    applyTransformations(newGrid);
    return newGrid;
  }

  const solution = deepCopyGrid(BASE_GRID);
  applyTransformations(solution);

  if (!validateBaseGrid(solution)) {
    return generateValidSudoku();
  }

  return solution;
}

/**
 * @description 초기 보드 생성
 * @param {Grid} solution - 솔루션 그리드
 * @returns {SudokuBoard} 초기 보드
 */
function createInitialBoard(solution: Grid): SudokuBoard {
  return solution.map((row) =>
    row.map((value) => ({
      value,
      isInitial: true,
      isSelected: false,
      isConflict: false,
      isHint: false,
      notes: [],
    })),
  );
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

  removeRandomCellsWithStrategy(board, solution, targetRemove, difficulty);

  return board;
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
  const board = createInitialBoard(solution);
  const cages = generateKillerCages(solution, difficulty);

  if (!validateCages(cages, solution)) {
    return generateKillerBoard(solution, difficulty);
  }

  const { hintsKeep } = KILLER_DIFFICULTY_RANGES[difficulty];
  const targetHints = difficulty === "expert" ? Math.max(MIN_EXPERT_HINTS, hintsKeep) : hintsKeep;
  const targetRemove = SUDOKU_CELL_COUNT - targetHints;

  removeKillerCells(board, cages, targetRemove, difficulty);

  return { board, cages };
}

/**
 * @description 전략적 시드 포인트 생성
 * @returns {GridPosition[]} 시드 포인트 배열
 */
function generateSeedPoints(): GridPosition[] {
  const points: GridPosition[] = [];

  // 격자 패턴으로 시드 포인트 생성 (겹치지 않도록)
  for (let startRow = 0; startRow < 3; startRow++) {
    for (let startCol = 0; startCol < 3; startCol++) {
      // 각 3x3 영역에서 2-3개의 시드 포인트 선택
      const regionPoints: GridPosition[] = [];

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          regionPoints.push([startRow * 3 + r, startCol * 3 + c]);
        }
      }

      shuffleArray(regionPoints);

      // 각 영역에서 2-3개만 선택
      const numToSelect = 2 + Math.floor(Math.random() * 2);
      points.push(...regionPoints.slice(0, numToSelect));
    }
  }

  shuffleArray(points);
  return points;
}

/**
 * @description 유효한 이웃 셀들 반환
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {Grid} solution - 솔루션
 * @param {Set<string>} localUsed - 로컬 사용된 셀 집합
 * @param {Set<string>} globalUsed - 전역 사용된 셀 집합
 * @param {Set<number>} usedValues - 사용된 값 집합
 * @returns {GridPosition[]} 유효한 이웃 셀들 배열
 */
function getValidNeighbors(
  row: number,
  col: number,
  solution: Grid,
  localUsed: Set<string>,
  globalUsed: Set<string>,
  usedValues: Set<number>,
): GridPosition[] {
  const neighbors: GridPosition[] = [];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]; // 상하좌우

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
      const key = `${newRow}-${newCol}`;
      const value = solution[newRow][newCol];

      // 사용되지 않았고 중복 값이 아닌 셀만 선택
      if (!localUsed.has(key) && !globalUsed.has(key) && !usedValues.has(value)) {
        neighbors.push([newRow, newCol]);
      }
    }
  }

  return neighbors;
}

/**
 * @description 시드에서 케이지 확장
 * @param {Grid} solution - 솔루션
 * @param {GridPosition} seed - 시드 포인트
 * @param {number} maxSize - 최대 케이지 크기
 * @param {number} minSize - 최소 케이지 크기
 * @param {Set<string>} globalUsed - 전역 사용된 셀 집합
 * @returns {Array<{ cells: GridPosition[]; sum: number }> | null} 케이지 데이터 또는 null
 */
function growCageFromSeed(
  solution: Grid,
  seed: GridPosition,
  maxSize: number,
  minSize: number,
  globalUsed: Set<string>,
): { cells: GridPosition[]; sum: number } | null {
  const [startRow, startCol] = seed;
  const startKey = `${startRow}-${startCol}`;

  if (globalUsed.has(startKey)) return null;

  const cage: GridPosition[] = [seed];
  const used = new Set([startKey]);
  const usedValues = new Set([solution[startRow][startCol]]);

  // BFS로 케이지 확장
  const queue: GridPosition[] = [seed];
  let targetSize = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
  targetSize = Math.min(targetSize, maxSize);

  while (queue.length > 0 && cage.length < targetSize) {
    const current = queue.shift()!;
    const [row, col] = current;

    // 인접한 셀들 찾기
    const neighbors = getValidNeighbors(row, col, solution, used, globalUsed, usedValues);

    if (neighbors.length === 0) {
      // 더 이상 확장할 수 없으면 다른 큐의 셀로 시도
      continue;
    }

    // 가장 적합한 이웃 선택
    neighbors.sort((a, b) => {
      const scoreA = calculateNeighborScore(a, cage);
      const scoreB = calculateNeighborScore(b, cage);
      return scoreB - scoreA;
    });

    const bestNeighbor = neighbors[0];
    const [nRow, nCol] = bestNeighbor;
    const nKey = `${nRow}-${nCol}`;
    const nValue = solution[nRow][nCol];

    cage.push(bestNeighbor);
    used.add(nKey);
    usedValues.add(nValue);
    queue.push(bestNeighbor);
  }

  // 최소 크기 확인
  if (cage.length < minSize) {
    return null;
  }

  const sum = cage.reduce((total, [r, c]) => total + solution[r][c], 0);

  return { cells: cage, sum };
}

/**
 * @description 전략적 케이지 생성
 * @param {Grid} solution - 솔루션
 * @param {number} maxCageSize - 최대 케이지 크기
 * @param {number} minCageSize - 최소 케이지 크기
 * @returns {Array<{ cells: GridPosition[]; sum: number }>} 케이지 배열
 */
function generateCagesWithStrategy(
  solution: Grid,
  maxCageSize: number,
  minCageSize: number,
): Array<{ cells: GridPosition[]; sum: number }> {
  const cages: Array<{ cells: GridPosition[]; sum: number }> = [];
  const used = new Set<string>();

  // 시드 포인트들을 전략적으로 선택
  const seedPoints = generateSeedPoints();

  for (const seedPoint of seedPoints) {
    const [row, col] = seedPoint;
    const key = `${row}-${col}`;

    if (used.has(key)) continue;

    // 이 시드부터 케이지 확장
    const cageData = growCageFromSeed(solution, seedPoint, maxCageSize, minCageSize, used);

    if (cageData && cageData.cells.length >= minCageSize) {
      cages.push(cageData);
      cageData.cells.forEach(([r, c]) => used.add(`${r}-${c}`));
    }
  }

  return cages;
}

/**
 * @description 배열을 주어진 크기로 분할
 * @param {T[]} array - 분할할 배열
 * @param {number} chunkSize - 분할 크기
 * @returns {T[][]} 분할된 배열
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * @description 인접한 최적의 케이지 찾기
 * @param {number} row - 행
 * @param {number} col - 열
 * @param {KillerCage[]} cages - 케이지 배열
 * @param {Grid} solution - 솔루션
 * @param {number} maxCageSize - 최대 케이지 크기
 * @returns {KillerCage | null} 최적의 케이지
 */
function findBestAdjacentCage(
  row: number,
  col: number,
  cages: KillerCage[],
  solution: Grid,
  maxCageSize: number, // 매개변수 추가
): KillerCage | null {
  const cellValue = solution[row][col];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const candidateCages: Array<{ cage: KillerCage; score: number }> = [];

  for (const cage of cages) {
    // 케이지 크기 제한 확인
    if (cage.cells.length >= maxCageSize) continue;

    // 인접성 검사
    let isAdjacent = false;
    for (const [cageRow, cageCol] of cage.cells) {
      for (const [dRow, dCol] of directions) {
        if (cageRow + dRow === row && cageCol + dCol === col) {
          isAdjacent = true;
          break;
        }
      }
      if (isAdjacent) break;
    }

    if (!isAdjacent) continue;

    // 중복 값 검사
    const cageValues = cage.cells.map(([r, c]) => solution[r][c]);
    if (cageValues.includes(cellValue)) continue;

    // 점수 계산
    let score = 0;

    // 케이지 크기 (작을수록 높은 점수)
    score += Math.max(0, maxCageSize - cage.cells.length);

    // 케이지 모양의 규칙성
    const minRow = Math.min(...cage.cells.map(([r]) => r));
    const maxRow = Math.max(...cage.cells.map(([r]) => r));
    const minCol = Math.min(...cage.cells.map(([, c]) => c));
    const maxCol = Math.max(...cage.cells.map(([, c]) => c));

    const boundingArea = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    const compactness = cage.cells.length / boundingArea;
    score += compactness * 2;

    candidateCages.push({ cage, score });
  }

  if (candidateCages.length === 0) return null;

  // 최고 점수의 케이지 반환
  candidateCages.sort((a, b) => b.score - a.score);
  return candidateCages[0].cage;
}

/**
 * @description 인접한 셀들 그룹화 (개선된 버전)
 * @param {GridPosition[]} cells - 셀 배열
 * @returns {GridPosition[][]} 그룹화된 셀 배열
 */
export function groupAdjacentCells(cells: GridPosition[]): GridPosition[][] {
  const groups: GridPosition[][] = [];
  const visited = new Set<string>();

  // O(1) 조회를 위한 셀 좌표 Set 사전 구축
  const cellSet = new Set<string>(cells.map(([r, c]) => `${r}-${c}`));

  for (const cell of cells) {
    const [row, col] = cell;
    const key = `${row}-${col}`;

    if (visited.has(key)) continue;

    // BFS로 연결된 셀들 찾기
    const group: GridPosition[] = [];
    const queue: GridPosition[] = [cell];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      const [cRow, cCol] = current;
      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];

      for (const [dRow, dCol] of directions) {
        const newRow = cRow + dRow;
        const newCol = cCol + dCol;
        const newKey = `${newRow}-${newCol}`;

        if (!visited.has(newKey) && cellSet.has(newKey)) {
          visited.add(newKey);
          queue.push([newRow, newCol]);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * @description 개선된 남은 셀 처리
 * @param {KillerCage[]} cages - 케이지 배열
 * @param {Set<string>} assignedCells - 할당된 셀 집합
 * @param {Grid} solution - 솔루션
 * @param {number} maxCageSize - 최대 케이지 크기
 */
function handleRemainingCellsImproved(
  cages: KillerCage[],
  assignedCells: Set<string>,
  solution: Grid,
  maxCageSize: number, // 매개변수 추가
): void {
  const remainingCells: GridPosition[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const key = `${row}-${col}`;
      if (!assignedCells.has(key)) {
        remainingCells.push([row, col]);
      }
    }
  }

  if (remainingCells.length === 0) return;

  // 인접한 케이지와 합치기 시도 (크기 제한 추가)
  const processed = new Set<string>();

  for (const [row, col] of remainingCells) {
    const key = `${row}-${col}`;
    if (processed.has(key)) continue;

    const bestCage = findBestAdjacentCage(row, col, cages, solution, maxCageSize);

    if (bestCage) {
      bestCage.cells.push([row, col]);
      bestCage.sum += solution[row][col];
      assignedCells.add(key);
      processed.add(key);
    }
  }

  // 여전히 남은 셀들을 새로운 작은 케이지로 그룹화
  const stillRemaining = remainingCells.filter(([r, c]) => !processed.has(`${r}-${c}`));

  if (stillRemaining.length > 0) {
    const groups = groupAdjacentCells(stillRemaining);
    let nextCageId = Math.max(...cages.map((c) => c.id)) + 1;

    groups.forEach((group) => {
      if (group.length >= 1) {
        // 그룹이 maxCageSize를 초과하면 분할
        const chunks = chunkArray(group, maxCageSize);

        chunks.forEach((chunk) => {
          const sum = chunk.reduce((total, [r, c]) => total + solution[r][c], 0);
          const newCage: KillerCage = {
            id: nextCageId++,
            cells: chunk,
            sum: sum,
          };
          cages.push(newCage);

          chunk.forEach(([r, c]) => {
            assignedCells.add(`${r}-${c}`);
          });
        });
      }
    });
  }
}

/**
 * @description 개선된 킬러 스도쿠 케이지 생성기
 * @param {Grid} solution - 솔루션
 * @param {Difficulty} difficulty - 난이도
 * @returns {KillerCage[]} 케이지 배열
 */
export function generateKillerCages(solution: Grid, difficulty: Difficulty): KillerCage[] {
  const { maxCageSize } = KILLER_DIFFICULTY_RANGES[difficulty];
  const minCageSize = 1;

  const cages: KillerCage[] = [];
  const assignedCells = new Set<string>();
  let cageId = 1;

  // 개선된 케이지 생성 전략
  const result = generateCagesWithStrategy(solution, maxCageSize, minCageSize);

  result.forEach((cageData) => {
    const cage: KillerCage = {
      id: cageId++,
      cells: cageData.cells,
      sum: cageData.sum,
    };
    cages.push(cage);

    cageData.cells.forEach(([r, c]) => {
      assignedCells.add(`${r}-${c}`);
    });
  });

  // 누락된 셀 처리 (maxCageSize 전달)
  handleRemainingCellsImproved(cages, assignedCells, solution, maxCageSize);

  // 최종 검증
  if (!validateAllCages(cages, solution)) {
    return generateKillerCages(solution, difficulty);
  }

  return cages;
}
