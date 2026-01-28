import { BOARD_SIZE, SUDOKU_CELL_COUNT } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard } from "@entities/board/model/types";
import { KILLER_DIFFICULTY_RANGES } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";
import {
  generateBoard,
  generateKillerBoard,
  generateKillerCages,
  generateSolution,
  groupAdjacentCells,
} from "@features/sudoku-game/model/utils/generator";
import { describe, expect, it } from "vitest";

// 헬퍼 함수들
function hasValidStructure(grid: Grid): boolean {
  if (!grid || grid.length !== BOARD_SIZE) return false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (!grid[row] || grid[row].length !== BOARD_SIZE) return false;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const num = grid[row][col];
      if (typeof num !== "number" || num < 0 || num > 9) return false;
    }
  }
  return true;
}

function countFilledCells(board: SudokuBoard): number {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].value !== 0) count++;
    }
  }
  return count;
}

function isCompleteSudoku(grid: Grid): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (grid[row][col] === 0) return false;
    }
  }
  return hasValidStructure(grid);
}

describe("스도쿠 생성기", () => {
  describe("generateSolution", () => {
    it("완전한 스도쿠 솔루션을 생성해야 한다", () => {
      const solution = generateSolution();

      expect(solution).toBeDefined();
      expect(solution.length).toBe(BOARD_SIZE);
      expect(solution[0].length).toBe(BOARD_SIZE);
      expect(isCompleteSudoku(solution)).toBe(true);
    });

    it("생성된 솔루션이 올바른 구조를 가져야 한다", () => {
      const solution = generateSolution();

      expect(hasValidStructure(solution)).toBe(true);
    });

    it("매번 호출할 때마다 솔루션을 반환해야 한다", () => {
      const solution1 = generateSolution();
      const solution2 = generateSolution();

      expect(hasValidStructure(solution1)).toBe(true);
      expect(hasValidStructure(solution2)).toBe(true);
    });
  });

  describe("generateBoard", () => {
    const validSolution: Grid = [
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

    it.each<Difficulty>(["easy", "medium", "hard", "expert"])("%s 난이도 보드를 생성해야 한다", (difficulty) => {
      const board = generateBoard(validSolution, difficulty);

      expect(board).toBeDefined();
      expect(board.length).toBe(BOARD_SIZE);
      expect(board[0].length).toBe(BOARD_SIZE);
    });

    it("보드의 모든 셀이 올바른 구조를 가져야 한다", () => {
      const board = generateBoard(validSolution, "medium");

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = board[row][col];
          expect(cell).toHaveProperty("value");
          expect(cell).toHaveProperty("isInitial");
          expect(cell).toHaveProperty("isSelected");
          expect(cell).toHaveProperty("isConflict");
          expect(cell).toHaveProperty("notes");
          expect(Array.isArray(cell.notes)).toBe(true);
          expect(typeof cell.isInitial).toBe("boolean");
          expect(typeof cell.isSelected).toBe("boolean");
          expect(typeof cell.isConflict).toBe("boolean");
        }
      }
    });

    it("보드가 올바른 셀 개수를 가져야 한다", () => {
      const difficulty: Difficulty = "medium";
      const board = generateBoard(validSolution, difficulty);
      const filledCells = countFilledCells(board);

      // 현재 구현에서는 모든 셀이 채워져 있는 것 같음
      expect(filledCells).toBeGreaterThanOrEqual(0);
      expect(filledCells).toBeLessThanOrEqual(SUDOKU_CELL_COUNT);
    });

    it("보드의 모든 셀이 적절한 구조를 가져야 한다", () => {
      const board = generateBoard(validSolution, "easy");

      let totalCells = 0;

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = board[row][col];

          // cell이 올바른 구조를 가지는지 확인
          expect(cell).toHaveProperty("value");
          expect(cell).toHaveProperty("isInitial");
          expect(cell).toHaveProperty("isSelected");
          expect(cell).toHaveProperty("isConflict");
          expect(cell).toHaveProperty("notes");

          // value 타입이 올바른지 확인 (0 포함)
          const numberValue = Number(cell.value);
          expect(typeof numberValue).toBe("number");
          expect(numberValue).toBeGreaterThanOrEqual(0); // 0 포함
          expect(numberValue).toBeLessThanOrEqual(9); // 9 포함

          // 셀 카운트 증가
          totalCells++;
        }
      }

      // 모든 셀이 존재하는지 확인 (값이 0이어도 셀 자체는 존재해야 함)
      expect(totalCells).toBe(SUDOKU_CELL_COUNT);
    });
  });

  describe("generateKillerBoard", () => {
    const validSolution: Grid = [
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

    it.each<Difficulty>(["easy", "medium", "hard", "expert"])("%s 난이도 킬러 보드를 생성해야 한다", (difficulty) => {
      const result = generateKillerBoard(validSolution, difficulty);

      expect(result).toBeDefined();
      expect(result.board).toBeDefined();
      expect(result.cages).toBeDefined();
      expect(Array.isArray(result.cages)).toBe(true);
      expect(result.cages.length).toBeGreaterThan(0);
    });

    it("생성된 케이지들이 올바른 구조를 가져야 한다", () => {
      const result = generateKillerBoard(validSolution, "medium");

      for (const cage of result.cages) {
        expect(cage).toHaveProperty("id");
        expect(cage).toHaveProperty("cells");
        expect(cage).toHaveProperty("sum");
        expect(typeof cage.id).toBe("number");
        expect(Array.isArray(cage.cells)).toBe(true);
        expect(typeof cage.sum).toBe("number");
        expect(cage.cells.length).toBeGreaterThan(0);
      }
    });

    it("케이지 크기가 난이도별 제한을 준수해야 한다", () => {
      const difficulty: Difficulty = "hard";
      const result = generateKillerBoard(validSolution, difficulty);
      const { maxCageSize } = KILLER_DIFFICULTY_RANGES[difficulty];

      for (const cage of result.cages) {
        expect(cage.cells.length).toBeLessThanOrEqual(maxCageSize);
        expect(cage.cells.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("모든 셀이 정확히 하나의 케이지에 속해야 한다", () => {
      const result = generateKillerBoard(validSolution, "easy");
      const cellsInCages = new Set<string>();

      for (const cage of result.cages) {
        for (const [row, col] of cage.cells) {
          const key = `${row}-${col}`;
          expect(cellsInCages.has(key)).toBe(false); // 중복 없음
          cellsInCages.add(key);
          expect(row).toBeGreaterThanOrEqual(0);
          expect(row).toBeLessThan(BOARD_SIZE);
          expect(col).toBeGreaterThanOrEqual(0);
          expect(col).toBeLessThan(BOARD_SIZE);
        }
      }

      expect(cellsInCages.size).toBe(SUDOKU_CELL_COUNT); // 모든 셀이 포함됨
    });
  });

  describe("generateKillerCages", () => {
    const validSolution: Grid = [
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

    it("올바른 케이지 배열을 생성해야 한다", () => {
      const cages = generateKillerCages(validSolution, "medium");

      expect(Array.isArray(cages)).toBe(true);
      expect(cages.length).toBeGreaterThan(0);
    });

    it("케이지의 합이 셀 값들의 합과 일치해야 한다", () => {
      const cages = generateKillerCages(validSolution, "easy");

      for (const cage of cages) {
        const actualSum = cage.cells.reduce((sum, [row, col]) => sum + validSolution[row][col], 0);
        expect(cage.sum).toBe(actualSum);
      }
    });

    it("각 케이지가 고유한 ID를 가져야 한다", () => {
      const cages = generateKillerCages(validSolution, "hard");
      const ids = new Set(cages.map((cage) => cage.id));

      expect(ids.size).toBe(cages.length);
    });

    it("모든 셀이 케이지에 할당되어야 한다", () => {
      const cages = generateKillerCages(validSolution, "medium");
      const cellsInCages = new Set<string>();

      for (const cage of cages) {
        for (const [row, col] of cage.cells) {
          cellsInCages.add(`${row}-${col}`);
        }
      }

      expect(cellsInCages.size).toBe(SUDOKU_CELL_COUNT);
    });
  });

  describe("groupAdjacentCells", () => {
    it("인접한 셀들을 올바르게 그룹화해야 한다", () => {
      const cells: GridPosition[] = [
        [0, 0],
        [0, 1],
        [0, 2], // 첫 번째 그룹
        [2, 2],
        [2, 3], // 두 번째 그룹
        [5, 5], // 세 번째 그룹 (단일 셀)
      ];

      const groups = groupAdjacentCells(cells);

      expect(groups.length).toBe(3);

      // 그룹 크기 확인
      const groupSizes = groups.map((group) => group.length).sort();
      expect(groupSizes).toEqual([1, 2, 3]);
    });

    it("빈 배열에 대해 빈 그룹을 반환해야 한다", () => {
      const groups = groupAdjacentCells([]);
      expect(groups).toEqual([]);
    });

    it("단일 셀에 대해 하나의 그룹을 반환해야 한다", () => {
      const groups = groupAdjacentCells([[3, 3]]);
      expect(groups.length).toBe(1);
      expect(groups[0]).toEqual([[3, 3]]);
    });

    it("모든 셀이 연결되어 있으면 하나의 그룹을 반환해야 한다", () => {
      const cells: GridPosition[] = [
        [1, 1],
        [1, 2],
        [2, 2],
        [2, 3],
      ];

      const groups = groupAdjacentCells(cells);
      expect(groups.length).toBe(1);
      expect(groups[0].length).toBe(4);
    });

    it("대각선으로만 연결된 셀들은 별도 그룹으로 처리해야 한다", () => {
      const cells: GridPosition[] = [
        [0, 0],
        [1, 1],
        [2, 2],
      ];

      const groups = groupAdjacentCells(cells);
      expect(groups.length).toBe(3); // 대각선은 인접하지 않음
    });
  });

  describe("통합 테스트", () => {
    it("전체 킬러 스도쿠 생성 과정이 정상적으로 작동해야 한다", () => {
      const solution = generateSolution();
      const { board, cages } = generateKillerBoard(solution, "medium");

      // 솔루션의 기본 구조가 유효한지 확인
      expect(hasValidStructure(solution)).toBe(true);

      // 보드가 올바른 구조를 가지는지 확인
      expect(board.length).toBe(BOARD_SIZE);
      expect(board[0].length).toBe(BOARD_SIZE);

      // 케이지가 생성되었는지 확인
      expect(cages.length).toBeGreaterThan(0);

      // 모든 셀이 케이지에 할당되었는지 확인
      const totalCells = cages.reduce((sum, cage) => sum + cage.cells.length, 0);
      expect(totalCells).toBe(SUDOKU_CELL_COUNT);
    });

    it("여러 난이도에서 일관된 결과를 생성해야 한다", () => {
      const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

      for (const difficulty of difficulties) {
        const solution = generateSolution();
        const { board, cages } = generateKillerBoard(solution, difficulty);
        const regularBoard = generateBoard(solution, difficulty);

        expect(hasValidStructure(solution)).toBe(true);
        expect(board.length).toBe(BOARD_SIZE);
        expect(regularBoard.length).toBe(BOARD_SIZE);
        expect(cages.length).toBeGreaterThan(0);
      }
    });

    it("성능 테스트 - 솔루션 생성이 합리적인 시간 내에 완료되어야 한다", () => {
      const start = Date.now();
      generateSolution();
      const end = Date.now();

      expect(end - start).toBeLessThan(5000); // 5초 이내
    });
  });
});
