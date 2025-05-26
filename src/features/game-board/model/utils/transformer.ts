import { BLOCK_SIZE, BOARD_NUMBERS, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid } from "@entities/board/model/types";
import { shuffleArray } from "@features/game-board/model/utils";
/**
 * @description 무작위 숫자 매핑 생성 (1-9 → 1-9 셔플)
 * @returns {Map<number, number>} 숫자 매핑 맵
 */
export function createRandomNumberMapping(): Map<number, number> {
  const shuffled = [...BOARD_NUMBERS];
  shuffleArray(shuffled);

  const mapping = new Map<number, number>();
  BOARD_NUMBERS.forEach((num, idx) => {
    mapping.set(num, shuffled[idx]);
  });

  return mapping;
}

/**
 * @description 블록 내에서 무작위 열 교환
 * @param {Grid} grid - 대상 그리드
 */
export function swapRandomColumnsWithinBlocks(grid: Grid): void {
  for (let block = 0; block < BLOCK_SIZE; block++) {
    const baseCol = block * BLOCK_SIZE;
    const col1 = baseCol + Math.floor(Math.random() * BLOCK_SIZE);
    const col2 = baseCol + Math.floor(Math.random() * BLOCK_SIZE);

    if (col1 !== col2) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        [grid[row][col1], grid[row][col2]] = [grid[row][col2], grid[row][col1]];
      }
    }
  }
}

/**
 * @description 무작위 행 블록 교환
 * @param {Grid} grid - 대상 그리드
 */
export function swapRandomRowBlocks(grid: Grid): void {
  const block1 = Math.floor(Math.random() * BLOCK_SIZE);
  const block2 = Math.floor(Math.random() * BLOCK_SIZE);

  if (block1 !== block2) {
    for (let i = 0; i < BLOCK_SIZE; i++) {
      const row1 = block1 * BLOCK_SIZE + i;
      const row2 = block2 * BLOCK_SIZE + i;
      [grid[row1], grid[row2]] = [grid[row2], grid[row1]];
    }
  }
}

/**
 * @description 무작위 열 블록 교환
 * @param {Grid} grid - 대상 그리드
 */
export function swapRandomColumnBlocks(grid: Grid): void {
  const block1 = Math.floor(Math.random() * BLOCK_SIZE);
  const block2 = Math.floor(Math.random() * BLOCK_SIZE);

  if (block1 !== block2) {
    for (let i = 0; i < BLOCK_SIZE; i++) {
      const col1 = block1 * BLOCK_SIZE + i;
      const col2 = block2 * BLOCK_SIZE + i;

      for (let row = 0; row < BOARD_SIZE; row++) {
        [grid[row][col1], grid[row][col2]] = [grid[row][col2], grid[row][col1]];
      }
    }
  }
}

/**
 * @description 그리드를 90도 회전
 * @param {Grid} grid - 대상 그리드
 */
export function rotateGrid90(grid: Grid): void {
  const size = grid.length;
  const temp = structuredClone(grid);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[col][size - 1 - row] = temp[row][col];
    }
  }
}

/**
 * @description 그리드 수평 반사
 * @param {Grid} grid - 대상 그리드
 */
export function reflectHorizontal(grid: Grid): void {
  grid.reverse();
}

/**
 * @description 그리드 수직 반사
 * @param {Grid} grid - 대상 그리드
 */
export function reflectVertical(grid: Grid): void {
  for (let row = 0; row < BOARD_SIZE; row++) {
    grid[row].reverse();
  }
}

/**
 * @description 그리드 회전 또는 반사 적용
 * @param {Grid} grid - 대상 그리드
 */
export function rotateOrReflectGrid(grid: Grid): void {
  const operations = [() => rotateGrid90(grid), () => reflectHorizontal(grid), () => reflectVertical(grid)];

  // 무작위 작업 선택
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
}

/**
 * @description 숫자 매핑을 그리드에 적용
 * @param {Grid} grid - 대상 그리드
 * @param {Map<number, number>} mapping - 숫자 매핑
 */
export function applyNumberMapping(grid: Grid, mapping: Map<number, number>): void {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      grid[row][col] = mapping.get(grid[row][col]) ?? grid[row][col];
    }
  }
}

/**
 * @description 블록 내에서 무작위 행 교환
 * @param {Grid} grid - 대상 그리드
 */
export function swapRandomRowsWithinBlocks(grid: Grid): void {
  for (let block = 0; block < BLOCK_SIZE; block++) {
    const baseRow = block * BLOCK_SIZE;
    const row1 = baseRow + Math.floor(Math.random() * BLOCK_SIZE);
    const row2 = baseRow + Math.floor(Math.random() * BLOCK_SIZE);

    if (row1 !== row2) {
      [grid[row1], grid[row2]] = [grid[row2], grid[row1]];
    }
  }
}

/**
 * @description 스도쿠 그리드에 무작위 변환 적용
 * @description 유효성을 유지하면서 패턴 변형
 * @param {Grid} grid - 변환할 스도쿠 그리드
 */
export function applyTransformations(grid: Grid): void {
  // 1. 숫자 셔플 - 1-9를 무작위로 다른 숫자에 매핑
  const numberMap = createRandomNumberMapping();

  // 2. 구조적 변환 (여러 단계)
  const transforms = [
    () => swapRandomRowsWithinBlocks(grid),
    () => swapRandomColumnsWithinBlocks(grid),
    () => swapRandomRowBlocks(grid),
    () => swapRandomColumnBlocks(grid),
    () => rotateOrReflectGrid(grid),
  ];

  // 무작위 순서로 여러 번 변환 적용
  for (let i = 0; i < 10; i++) {
    const randomTransform = transforms[Math.floor(Math.random() * transforms.length)];
    randomTransform();
  }

  // 숫자 매핑 적용 (마지막에 수행)
  applyNumberMapping(grid, numberMap);
}
