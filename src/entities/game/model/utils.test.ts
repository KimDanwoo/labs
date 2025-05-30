import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid } from "@entities/board/model/types";
import { describe, expect, test } from "vitest"; // 또는 '@jest/globals'
import { getBlockNumbers, getColumnNumbers, getRowNumbers, isValidNumberSet } from "./utils";

// 테스트용 완전한 스도쿠 그리드 (해결된 상태) - 함수로 만들어 매번 새로운 인스턴스 생성
function createValidSudokuGrid(): Grid {
  return [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ];
}

// 테스트용 부분적으로 채워진 그리드 - 함수로 만들어 매번 새로운 인스턴스 생성
function createIncompleteSudokuGrid(): Grid {
  return [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
}

describe("isValidNumberSet", () => {
  test("유효한 1-9 숫자 세트를 올바르게 검증한다", () => {
    const validSet = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(isValidNumberSet(validSet)).toBe(true);
  });

  test("순서가 다른 유효한 숫자 세트를 올바르게 검증한다", () => {
    const validSet = [9, 1, 8, 2, 7, 3, 6, 4, 5];
    expect(isValidNumberSet(validSet)).toBe(true);
  });

  test("길이가 부족한 배열을 거부한다", () => {
    const shortSet = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(isValidNumberSet(shortSet)).toBe(false);
  });

  test("길이가 초과한 배열을 거부한다", () => {
    const longSet = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(isValidNumberSet(longSet)).toBe(false);
  });

  test("중복된 숫자가 있는 배열을 거부한다", () => {
    const duplicateSet = [1, 2, 3, 4, 5, 6, 7, 8, 8];
    expect(isValidNumberSet(duplicateSet)).toBe(false);
  });

  test("유효하지 않은 숫자가 포함된 배열을 거부한다", () => {
    const invalidSet = [0, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(isValidNumberSet(invalidSet)).toBe(false);
  });

  test("0이 포함된 배열을 거부한다", () => {
    const zeroSet = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    expect(isValidNumberSet(zeroSet)).toBe(false);
  });

  test("10이 포함된 배열을 거부한다", () => {
    const tenSet = [1, 2, 3, 4, 5, 6, 7, 8, 10];
    expect(isValidNumberSet(tenSet)).toBe(false);
  });

  test("빈 배열을 거부한다", () => {
    const emptySet: number[] = [];
    expect(isValidNumberSet(emptySet)).toBe(false);
  });

  test("음수가 포함된 배열을 거부한다", () => {
    const negativeSet = [-1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(isValidNumberSet(negativeSet)).toBe(false);
  });
});

describe("getRowNumbers", () => {
  test("첫 번째 행의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getRowNumbers(grid, 0);
    expect(result).toEqual([5, 3, 4, 6, 7, 8, 9, 1, 2]);
  });

  test("마지막 행의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getRowNumbers(grid, 8);
    expect(result).toEqual([3, 4, 5, 2, 8, 6, 1, 7, 9]);
  });

  test("중간 행의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getRowNumbers(grid, 4);
    expect(result).toEqual([4, 2, 6, 8, 5, 3, 7, 9, 1]);
  });

  test("0이 포함된 불완전한 행을 올바르게 반환한다", () => {
    const grid = createIncompleteSudokuGrid();
    const result = getRowNumbers(grid, 0);
    expect(result).toEqual([5, 3, 0, 0, 7, 0, 0, 0, 0]);
  });

  test("반환된 배열은 원본 배열의 참조이다", () => {
    const grid = createValidSudokuGrid();
    const result = getRowNumbers(grid, 0);

    // getRowNumbers는 grid[row]를 직접 반환하므로 참조가 같아야 함
    expect(result).toBe(grid[0]);

    // 반환된 배열 수정이 원본에 반영되는지 확인
    const originalValue = result[0];
    result[0] = 999;
    expect(grid[0][0]).toBe(999);

    // 원상 복구
    result[0] = originalValue;
  });
});

describe("getColumnNumbers", () => {
  test("첫 번째 열의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getColumnNumbers(grid, 0);
    expect(result).toEqual([5, 6, 1, 8, 4, 7, 9, 2, 3]);
  });

  test("마지막 열의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getColumnNumbers(grid, 8);
    expect(result).toEqual([2, 8, 7, 3, 1, 6, 4, 5, 9]);
  });

  test("중간 열의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getColumnNumbers(grid, 4);
    expect(result).toEqual([7, 9, 4, 6, 5, 2, 3, 1, 8]);
  });

  test("0이 포함된 불완전한 열을 올바르게 반환한다", () => {
    const grid = createIncompleteSudokuGrid();
    const result = getColumnNumbers(grid, 2);
    expect(result).toEqual([0, 0, 8, 0, 0, 0, 0, 0, 0]);
  });

  test("올바른 길이의 배열을 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getColumnNumbers(grid, 5);
    expect(result).toHaveLength(BOARD_SIZE);
  });
});

describe("getBlockNumbers", () => {
  test("첫 번째 블록(0,0)의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 0, 0);
    expect(result).toEqual([5, 3, 4, 6, 7, 2, 1, 9, 8]);
  });

  test("중앙 블록(1,1)의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 1, 1);
    expect(result).toEqual([7, 6, 1, 8, 5, 3, 9, 2, 4]);
  });

  test("마지막 블록(2,2)의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 2, 2);
    expect(result).toEqual([2, 8, 4, 6, 3, 5, 1, 7, 9]);
  });

  test("오른쪽 상단 블록(0,2)의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 0, 2);
    expect(result).toEqual([9, 1, 2, 3, 4, 8, 5, 6, 7]);
  });

  test("왼쪽 하단 블록(2,0)의 숫자들을 올바르게 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 2, 0);
    expect(result).toEqual([9, 6, 1, 2, 8, 7, 3, 4, 5]);
  });

  test("0이 포함된 불완전한 블록을 올바르게 반환한다", () => {
    const grid = createIncompleteSudokuGrid();
    const result = getBlockNumbers(grid, 0, 0);
    expect(result).toEqual([5, 3, 0, 6, 0, 0, 0, 9, 8]);
  });

  test("올바른 길이의 배열을 반환한다", () => {
    const grid = createValidSudokuGrid();
    const result = getBlockNumbers(grid, 1, 1);
    expect(result).toHaveLength(BOARD_SIZE);
  });

  test("블록 좌표가 올바르게 매핑된다", () => {
    const grid = createValidSudokuGrid();
    // 블록(1,1)은 실제 그리드의 (3,3)부터 (5,5)까지
    const result = getBlockNumbers(grid, 1, 1);
    const expected = [
      grid[3][3],
      grid[3][4],
      grid[3][5],
      grid[4][3],
      grid[4][4],
      grid[4][5],
      grid[5][3],
      grid[5][4],
      grid[5][5],
    ];
    expect(result).toEqual(expected);
  });
});

// 통합 테스트
describe("그리드 유틸리티 통합 테스트", () => {
  test("완성된 스도쿠 그리드의 모든 행이 유효하다", () => {
    const grid = createValidSudokuGrid();
    for (let row = 0; row < BOARD_SIZE; row++) {
      const rowNumbers = getRowNumbers(grid, row);
      expect(isValidNumberSet(rowNumbers)).toBe(true);
    }
  });

  test("완성된 스도쿠 그리드의 모든 열이 유효하다", () => {
    const grid = createValidSudokuGrid();
    for (let col = 0; col < BOARD_SIZE; col++) {
      const colNumbers = getColumnNumbers(grid, col);
      expect(isValidNumberSet(colNumbers)).toBe(true);
    }
  });

  test("완성된 스도쿠 그리드의 모든 블록이 유효하다", () => {
    const grid = createValidSudokuGrid();
    for (let blockRow = 0; blockRow < BLOCK_SIZE; blockRow++) {
      for (let blockCol = 0; blockCol < BLOCK_SIZE; blockCol++) {
        const blockNumbers = getBlockNumbers(grid, blockRow, blockCol);
        expect(isValidNumberSet(blockNumbers)).toBe(true);
      }
    }
  });

  test("불완전한 스도쿠 그리드는 유효하지 않다", () => {
    const grid = createIncompleteSudokuGrid();
    // 첫 번째 행이 불완전함
    const rowNumbers = getRowNumbers(grid, 0);
    expect(isValidNumberSet(rowNumbers)).toBe(false);

    // 첫 번째 열이 불완전함
    const colNumbers = getColumnNumbers(grid, 0);
    expect(isValidNumberSet(colNumbers)).toBe(false);

    // 첫 번째 블록이 불완전함
    const blockNumbers = getBlockNumbers(grid, 0, 0);
    expect(isValidNumberSet(blockNumbers)).toBe(false);
  });

  test("특정 셀이 포함된 행, 열, 블록을 모두 가져올 수 있다", () => {
    const grid = createValidSudokuGrid();
    const row = 4,
      col = 4; // 중앙 셀

    const rowNumbers = getRowNumbers(grid, row);
    const colNumbers = getColumnNumbers(grid, col);
    const blockNumbers = getBlockNumbers(grid, Math.floor(row / BLOCK_SIZE), Math.floor(col / BLOCK_SIZE));

    // 해당 셀의 값이 각각에 포함되어 있는지 확인
    const cellValue = grid[row][col];
    expect(rowNumbers).toContain(cellValue);
    expect(colNumbers).toContain(cellValue);
    expect(blockNumbers).toContain(cellValue);
  });
});

// 에러 케이스 테스트
describe("에러 케이스 테스트", () => {
  test("빈 그리드에서도 함수들이 정상 동작한다", () => {
    const emptyGrid: Grid = Array(9)
      .fill(null)
      .map(() => Array(9).fill(0));

    expect(() => getRowNumbers(emptyGrid, 0)).not.toThrow();
    expect(() => getColumnNumbers(emptyGrid, 0)).not.toThrow();
    expect(() => getBlockNumbers(emptyGrid, 0, 0)).not.toThrow();
  });
});

// 성능 테스트
describe("성능 테스트", () => {
  test("대용량 연산에서도 합리적인 시간 내에 완료된다", () => {
    const grid = createValidSudokuGrid();
    const startTime = Date.now();

    // 모든 행, 열, 블록을 여러 번 검사
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        getRowNumbers(grid, j);
        getColumnNumbers(grid, j);
      }

      for (let br = 0; br < BLOCK_SIZE; br++) {
        for (let bc = 0; bc < BLOCK_SIZE; bc++) {
          getBlockNumbers(grid, br, bc);
        }
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 1초 이내에 완료되어야 함
    expect(duration).toBeLessThan(1000);
  });
});
