import { BLOCK_SIZE, BOARD_SIZE, SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import { checkConflicts, shuffleArray } from "@features/game-board/model/utils";

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
    generateKillerCages(solution, difficulty);
  }

  return cages;
}

/**
 * 전략적 케이지 생성
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
 * 전략적 시드 포인트 생성
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
 * 시드에서 케이지 확장
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
 * 유효한 이웃 셀들 반환
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
 * 이웃 셀의 적합성 점수 계산
 */
function calculateNeighborScore(neighbor: GridPosition, currentCage: GridPosition[]): number {
  const [row, col] = neighbor;
  let score = 0;

  // 현재 케이지와의 연결성 점수
  let connections = 0;
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dRow, dCol] of directions) {
    const checkRow = row + dRow;
    const checkCol = col + dCol;

    if (currentCage.some(([cR, cC]) => cR === checkRow && cC === checkCol)) {
      connections++;
    }
  }

  score += connections * 2;

  // 케이지 모양의 규칙성 점수 (정사각형에 가까울수록 높은 점수)
  if (currentCage.length >= 4) {
    const minRow = Math.min(...currentCage.map(([r]) => r));
    const maxRow = Math.max(...currentCage.map(([r]) => r));
    const minCol = Math.min(...currentCage.map(([, c]) => c));
    const maxCol = Math.max(...currentCage.map(([, c]) => c));

    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;
    const aspectRatio = Math.min(width, height) / Math.max(width, height);

    score += aspectRatio;
  }

  // 블록 경계를 넘나드는 것에 대한 패널티
  const cageBlocks = new Set();
  currentCage.forEach(([r, c]) => {
    const blockId = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    cageBlocks.add(blockId);
  });

  const neighborBlock = Math.floor(row / 3) * 3 + Math.floor(col / 3);
  if (cageBlocks.has(neighborBlock)) {
    score += 1; // 같은 블록 내 확장은 보너스
  } else {
    score -= 0.5; // 블록 경계 넘는 것은 약간의 패널티
  }

  // 무작위성 추가
  score += Math.random() * 0.3;

  return score;
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
 * 개선된 남은 셀 처리
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
 * 인접한 셀들 그룹화 (개선된 버전)
 */
export function groupAdjacentCells(cells: GridPosition[]): GridPosition[][] {
  const groups: GridPosition[][] = [];
  const visited = new Set<string>();

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

        if (!visited.has(newKey) && cells.some(([r, c]) => r === newRow && c === newCol)) {
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
 * 모든 케이지의 유효성 검증
 */
function validateAllCages(cages: KillerCage[], solution: Grid): boolean {
  const allCells = new Set<string>();

  for (const cage of cages) {
    // 케이지 내 중복 숫자 검사
    const values = cage.cells.map(([r, c]) => solution[r][c]);
    const uniqueValues = new Set(values);

    if (values.length !== uniqueValues.size) {
      return false;
    }

    // 합계 검사
    const actualSum = values.reduce((sum, val) => sum + val, 0);
    if (actualSum !== cage.sum) {
      return false;
    }

    // 셀 중복 검사
    for (const [r, c] of cage.cells) {
      const cellKey = `${r}-${c}`;
      if (allCells.has(cellKey)) {
        return false;
      }
      allCells.add(cellKey);
    }
  }

  // 모든 셀이 케이지에 속하는지 검사
  if (allCells.size !== SUDOKU_CELL_COUNT) {
    return false;
  }

  return true;
}

/**
 * 킬러 스도쿠 케이지 유효성 검사 및 충돌 표시
 */
export function validateKillerCages(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  const newBoard = structuredClone(board);

  // 먼저 일반 스도쿠 규칙으로 충돌 검사
  const boardWithBasicConflicts = checkConflicts(newBoard);

  // 각 케이지별 검증
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();
    let allFilled = true;
    let hasConflict = false;

    // 케이지 내 모든 셀 검사
    for (const [row, col] of cage.cells) {
      const value = boardWithBasicConflicts[row][col].value;

      if (value === null) {
        allFilled = false;
        continue;
      }

      sum += value;

      // 케이지 내 중복 검사
      if (usedNumbers.has(value)) {
        hasConflict = true;
      }
      usedNumbers.add(value);
    }

    // 케이지 완성 시 합계 검사
    if (allFilled && sum !== cage.sum) {
      hasConflict = true;
    }

    // 진행 중에도 합이 초과되면 충돌
    if (sum > cage.sum) {
      hasConflict = true;
    }

    // 충돌이 있으면 케이지 내 모든 채워진 셀에 충돌 표시
    if (hasConflict) {
      for (const [row, col] of cage.cells) {
        if (boardWithBasicConflicts[row][col].value !== null) {
          boardWithBasicConflicts[row][col].isConflict = true;
        }
      }
    }
  }

  return boardWithBasicConflicts;
}

/**
 * 킬러 스도쿠 보드 완성도 검사
 */
export function isKillerBoardComplete(board: SudokuBoard, cages: KillerCage[]): boolean {
  // 1. 모든 셀이 채워져 있는지 확인
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.value === null || cell.isConflict) {
        return false;
      }
    }
  }

  // 2. 모든 케이지 규칙이 만족되는지 확인
  for (const cage of cages) {
    let sum = 0;
    const usedNumbers = new Set<number>();

    for (const [row, col] of cage.cells) {
      const value = board[row][col].value!;
      sum += value;

      if (usedNumbers.has(value)) {
        return false; // 케이지 내 중복
      }
      usedNumbers.add(value);
    }

    if (sum !== cage.sum) {
      return false; // 합계 불일치
    }
  }

  return true;
}

/**
 * 킬러 스도쿠 충돌 검사 (일반 규칙 + 케이지 규칙)
 */
export function checkKillerConflicts(board: SudokuBoard, cages: KillerCage[]): SudokuBoard {
  // 킬러 케이지 규칙 적용
  return validateKillerCages(board, cages);
}

/**
 * 케이지의 현재 상태 정보 반환
 */
export function getCageStatus(
  board: SudokuBoard,
  cage: KillerCage,
): {
  currentSum: number;
  filledCount: number;
  remainingSum: number;
  isEmpty: boolean;
  isComplete: boolean;
  hasConflict: boolean;
  duplicateValues: number[];
} {
  let currentSum = 0;
  let filledCount = 0;
  const usedValues = new Set<number>();
  const duplicateValues: number[] = [];

  for (const [row, col] of cage.cells) {
    const value = board[row][col].value;
    if (value !== null) {
      currentSum += value;
      filledCount++;

      if (usedValues.has(value)) {
        duplicateValues.push(value);
      }
      usedValues.add(value);
    }
  }

  const remainingSum = cage.sum - currentSum;
  const isEmpty = filledCount === 0;
  const isComplete = filledCount === cage.cells.length;
  const hasConflict = duplicateValues.length > 0 || currentSum > cage.sum || (isComplete && currentSum !== cage.sum);

  return {
    currentSum,
    filledCount,
    remainingSum,
    isEmpty,
    isComplete,
    hasConflict,
    duplicateValues: Array.from(new Set(duplicateValues)),
  };
}

/**
 * 케이지에서 가능한 숫자들 반환
 */
export function getPossibleValuesForCage(board: SudokuBoard, cage: KillerCage, targetCell: GridPosition): number[] {
  const [targetRow, targetCol] = targetCell;
  const possibleValues: number[] = [];

  // 케이지 내 이미 사용된 숫자들
  const usedInCage = new Set<number>();
  let currentSum = 0;
  let emptyCells = 0;

  for (const [row, col] of cage.cells) {
    const value = board[row][col].value;
    if (value !== null) {
      usedInCage.add(value);
      currentSum += value;
    } else {
      emptyCells++;
    }
  }

  // 각 숫자 1-9에 대해 검사
  for (let num = 1; num <= 9; num++) {
    // 케이지 내에서 이미 사용된 숫자는 제외
    if (usedInCage.has(num)) continue;

    // 행, 열, 블록에서 충돌하는지 검사
    let hasBasicConflict = false;

    // 행 검사
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c !== targetCol && board[targetRow][c].value === num) {
        hasBasicConflict = true;
        break;
      }
    }

    if (hasBasicConflict) continue;

    // 열 검사
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (r !== targetRow && board[r][targetCol].value === num) {
        hasBasicConflict = true;
        break;
      }
    }

    if (hasBasicConflict) continue;

    // 3x3 블록 검사
    const blockRow = Math.floor(targetRow / BLOCK_SIZE) * BLOCK_SIZE;
    const blockCol = Math.floor(targetCol / BLOCK_SIZE) * BLOCK_SIZE;

    for (let r = 0; r < BLOCK_SIZE; r++) {
      for (let c = 0; c < BLOCK_SIZE; c++) {
        const checkRow = blockRow + r;
        const checkCol = blockCol + c;

        if ((checkRow !== targetRow || checkCol !== targetCol) && board[checkRow][checkCol].value === num) {
          hasBasicConflict = true;
          break;
        }
      }
      if (hasBasicConflict) break;
    }

    if (hasBasicConflict) continue;

    // 케이지 합계 제약 검사
    const newSum = currentSum + num;
    const remainingCells = emptyCells - 1;

    // 현재 숫자를 넣었을 때 합이 초과하지 않는지
    if (newSum > cage.sum) continue;

    // 남은 셀들로 목표 합을 달성할 수 있는지
    if (remainingCells > 0) {
      const stillNeeded = cage.sum - newSum;
      const minPossible = remainingCells; // 최소 1씩
      const maxPossible = remainingCells * 9; // 최대 9씩

      if (stillNeeded < minPossible || stillNeeded > maxPossible) {
        continue;
      }
    } else {
      // 마지막 셀인 경우 정확히 맞아야 함
      if (newSum !== cage.sum) continue;
    }

    possibleValues.push(num);
  }

  return possibleValues;
}

/**
 * 케이지 힌트 정보 생성
 */
export function generateCageHint(cage: KillerCage): string {
  const combinations = findSumCombinations(cage.sum, cage.cells.length);

  let hint = `합계: ${cage.sum}`;

  if (combinations.length <= 3) {
    hint += ` (가능한 조합: ${combinations.map((combo) => combo.join("+")).join(", ")})`;
  }

  return hint;
}

/**
 * 주어진 합과 개수로 가능한 숫자 조합 찾기
 */
function findSumCombinations(targetSum: number, count: number): number[][] {
  const combinations: number[][] = [];

  function backtrack(remaining: number, usedCount: number, current: number[], used: Set<number>) {
    if (usedCount === count) {
      if (remaining === 0) {
        combinations.push([...current]);
      }
      return;
    }

    if (remaining <= 0 || usedCount >= count) return;

    const start = current.length > 0 ? current[current.length - 1] + 1 : 1;

    for (let num = start; num <= 9; num++) {
      if (used.has(num)) continue;
      if (remaining - num < 0) break;

      current.push(num);
      used.add(num);
      backtrack(remaining - num, usedCount + 1, current, used);
      current.pop();
      used.delete(num);
    }
  }

  backtrack(targetSum, 0, [], new Set());
  return combinations;
}
