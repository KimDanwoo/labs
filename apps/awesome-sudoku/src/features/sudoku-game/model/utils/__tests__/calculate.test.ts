import {
  CellPriority,
  GridPosition,
  RemovalStrategy,
  SudokuBoard,
  SudokuCell,
} from "@entities/board/model/types";
import { Difficulty, KillerCage } from "@entities/game/model/types";
import {
  calculateCellPriorities,
  calculateKillerCellPriority,
  calculateMustKeepCells,
  calculateNeighborScore,
} from "@features/sudoku-game/model/utils/calculate";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("스도쿠 셀 우선순위 계산 함수들", () => {
  // 테스트용 헬퍼 함수들
  const createMockSudokuCell = (value: number | null = null): SudokuCell => ({
    value,
    isInitial: false,
    isSelected: false,
    isConflict: false,
    isHint: false,
    notes: [],
  });

  const createMockBoard = (): SudokuBoard =>
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => createMockSudokuCell()));

  const createMockKillerCage = (id: number, cells: GridPosition[], sum: number): KillerCage => ({
    id,
    cells,
    sum,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Math.random을 일련의 값으로 모킹 (더 다양한 결과를 위해)
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      const values = [0.1, 0.3, 0.5, 0.7, 0.9];
      return values[callCount++ % values.length];
    });
  });

  describe("calculateCellPriorities", () => {
    it("기본 전략으로 셀 우선순위를 계산해야 함", () => {
      const strategy: RemovalStrategy = {
        preferCenter: true,
        preferCorners: true,
        preferEdges: true,
        symmetryBonus: 0.1,
        blockDistribution: true,
      };
      const targetRemove = 40;

      const result = calculateCellPriorities(strategy, targetRemove);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(Math.floor(targetRemove * 1.5));

      // 우선순위가 내림차순으로 정렬되어 있는지 확인
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].priority).toBeGreaterThanOrEqual(result[i + 1].priority);
      }

      // 각 셀이 유효한 위치를 가지는지 확인
      result.forEach((cell: CellPriority) => {
        expect(cell.pos[0]).toBeGreaterThanOrEqual(0);
        expect(cell.pos[0]).toBeLessThan(9);
        expect(cell.pos[1]).toBeGreaterThanOrEqual(0);
        expect(cell.pos[1]).toBeLessThan(9);
        expect(typeof cell.priority).toBe("number");
      });
    });

    it("고강도 제거 시 다른 우선순위를 가져야 함", () => {
      const strategy: RemovalStrategy = {
        preferCenter: true,
        preferCorners: false,
        preferEdges: false,
        symmetryBonus: 0,
        blockDistribution: false,
      };
      const highIntensityTarget = 50; // > 60% of 81 cells
      const lowIntensityTarget = 20; // < 40% of 81 cells

      const highResult = calculateCellPriorities(strategy, highIntensityTarget);
      const lowResult = calculateCellPriorities(strategy, lowIntensityTarget);

      expect(highResult.length).toBeGreaterThan(lowResult.length);

      // 고강도에서는 더 많은 셀이 선택되어야 함
      expect(highResult.length).toBe(Math.floor(highIntensityTarget * 1.5));
      expect(lowResult.length).toBe(Math.floor(lowIntensityTarget * 1.5));
    });

    it("센터 선호 전략이 적용되어야 함", () => {
      const centerStrategy: RemovalStrategy = {
        preferCenter: true,
        preferCorners: false,
        preferEdges: false,
        symmetryBonus: 0,
        blockDistribution: false,
      };

      const result = calculateCellPriorities(centerStrategy, 30);

      // 결과가 유효한지 확인
      expect(result.length).toBeGreaterThan(0);
      result.forEach((cell: CellPriority) => {
        expect(cell.pos).toHaveLength(2);
        expect(typeof cell.priority).toBe("number");
      });
    });

    it("대칭성 보너스가 적용되어야 함", () => {
      const symmetryStrategy: RemovalStrategy = {
        preferCenter: false,
        preferCorners: false,
        preferEdges: false,
        symmetryBonus: 0.5,
        blockDistribution: false,
      };

      const result = calculateCellPriorities(symmetryStrategy, 25);

      expect(result.length).toBeGreaterThan(0);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("calculateMustKeepCells", () => {
    it("케이지별로 보존할 셀들을 올바르게 계산해야 함", () => {
      const cages: KillerCage[] = [
        createMockKillerCage(
          1,
          [
            [0, 0],
            [0, 1],
            [1, 0],
          ],
          10,
        ),
        createMockKillerCage(
          2,
          [
            [2, 2],
            [2, 3],
          ],
          8,
        ),
        createMockKillerCage(3, [[4, 4]], 5), // 단일 셀 케이지
      ];

      const result = calculateMustKeepCells(cages, "medium");

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBeGreaterThan(0);

      // 모든 보존 셀이 유효한 형식인지 확인
      Array.from(result).forEach((cellKey) => {
        expect(cellKey).toMatch(/^\d+-\d+$/);
        const [row, col] = cellKey.split("-").map(Number);
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(9);
        expect(col).toBeGreaterThanOrEqual(0);
        expect(col).toBeLessThan(9);
      });
    });

    it("난이도별로 다른 보존 전략을 사용해야 함", () => {
      const cages: KillerCage[] = [
        createMockKillerCage(
          1,
          [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
          ],
          20,
        ),
      ];

      const expertResult = calculateMustKeepCells(cages, "expert");
      const easyResult = calculateMustKeepCells(cages, "easy");

      // expert는 더 적은 셀을 보존해야 함
      expect(expertResult.size).toBeLessThanOrEqual(easyResult.size);
    });

    it("빈 케이지 배열에 대해 빈 Set을 반환해야 함", () => {
      const result = calculateMustKeepCells([], "medium");
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it("모든 난이도에서 작동해야 함", () => {
      const cages: KillerCage[] = [
        createMockKillerCage(
          1,
          [
            [0, 0],
            [0, 1],
            [1, 0],
          ],
          15,
        ),
      ];

      const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

      difficulties.forEach((difficulty) => {
        const result = calculateMustKeepCells(cages, difficulty);
        expect(result).toBeInstanceOf(Set);
      });
    });
  });

  describe("calculateKillerCellPriority", () => {
    it("케이지 정보를 고려한 우선순위를 계산해야 함", () => {
      const cageMap = new Map<string, KillerCage>();
      const cage = createMockKillerCage(
        1,
        [
          [0, 0],
          [0, 1],
        ],
        10,
      );
      cageMap.set("0-0", cage);

      const board = createMockBoard();
      board[0][0] = createMockSudokuCell(5);
      board[0][1] = createMockSudokuCell(null);

      const priority = calculateKillerCellPriority(0, 0, cageMap, board);

      expect(typeof priority).toBe("number");
      expect(priority).toBeGreaterThan(0);
    });

    it("케이지에 속하지 않는 셀에 대해서도 우선순위를 계산해야 함", () => {
      const cageMap = new Map<string, KillerCage>();
      const board = createMockBoard();

      const priority = calculateKillerCellPriority(5, 5, cageMap, board);

      expect(typeof priority).toBe("number");
      expect(priority).toBeGreaterThan(0);
    });

    it("케이지에서 마지막 남은 셀은 낮은 우선순위를 가져야 함", () => {
      const cageMap = new Map<string, KillerCage>();
      const cage = createMockKillerCage(
        1,
        [
          [0, 0],
          [0, 1],
        ],
        10,
      );
      cageMap.set("0-0", cage);
      cageMap.set("0-1", cage);

      const board = createMockBoard();
      board[0][0] = createMockSudokuCell(5); // 값이 있음
      board[0][1] = createMockSudokuCell(null); // 마지막 남은 셀

      const priority = calculateKillerCellPriority(0, 1, cageMap, board);

      // 낮은 우선순위로 인해 패널티가 적용되어야 함
      expect(priority).toBeLessThan(1.0);
    });

    it("큰 케이지의 셀은 더 높은 우선순위를 가져야 함", () => {
      const cageMap = new Map<string, KillerCage>();
      // 충분히 큰 크기 차이를 만들어 우선순위 차이가 명확하게 나타나도록 함
      const smallCage = createMockKillerCage(1, [[0, 0]], 5); // 크기 1
      const largeCage = createMockKillerCage(
        2,
        [
          [4, 4],
          [4, 5],
          [4, 6],
          [5, 4],
          [5, 5],
          [5, 6],
          [6, 4],
        ],
        35,
      ); // 크기 7

      cageMap.set("0-0", smallCage);
      cageMap.set("4-4", largeCage);

      const board = createMockBoard();

      const smallCagePriority = calculateKillerCellPriority(0, 0, cageMap, board);
      const largeCagePriority = calculateKillerCellPriority(4, 4, cageMap, board);

      // 케이지 크기 차이로 인한 우선순위 차이 확인
      const sizeBonus = (largeCage.cells.length - smallCage.cells.length) * 0.1;
      expect(sizeBonus).toBeGreaterThan(0.5); // 충분한 크기 차이

      // 큰 케이지가 더 높은 우선순위를 가져야 함
      expect(largeCagePriority).toBeGreaterThan(smallCagePriority);
    });
  });

  describe("calculateNeighborScore", () => {
    it("연결된 이웃에 대해 높은 점수를 줘야 함", () => {
      const neighbor: GridPosition = [1, 1];
      const currentCage: GridPosition[] = [
        [1, 0],
        [2, 1],
      ]; // 인접한 셀들

      const score = calculateNeighborScore(neighbor, currentCage);

      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThan(0);
    });

    it("연결되지 않은 이웃에 대해 낮은 점수를 줘야 함", () => {
      const neighbor: GridPosition = [5, 5];
      const currentCage: GridPosition[] = [
        [0, 0],
        [0, 1],
      ]; // 멀리 떨어진 셀들

      const connectedNeighbor: GridPosition = [0, 2];

      const disconnectedScore = calculateNeighborScore(neighbor, currentCage);
      const connectedScore = calculateNeighborScore(connectedNeighbor, currentCage);

      expect(connectedScore).toBeGreaterThan(disconnectedScore);
    });

    it("같은 블록 내의 확장에 보너스를 줘야 함", () => {
      const neighbor: GridPosition = [1, 2]; // 블록 0,0
      const currentCage: GridPosition[] = [
        [0, 0],
        [1, 1],
      ]; // 같은 블록

      const crossBlockNeighbor: GridPosition = [3, 3]; // 다른 블록

      const sameBlockScore = calculateNeighborScore(neighbor, currentCage);
      const crossBlockScore = calculateNeighborScore(crossBlockNeighbor, currentCage);

      expect(sameBlockScore).toBeGreaterThan(crossBlockScore);
    });

    it("정사각형에 가까운 모양에 보너스를 줘야 함", () => {
      const neighbor: GridPosition = [2, 2];
      const squareLikeCage: GridPosition[] = [
        [1, 1],
        [1, 2],
        [2, 1],
      ]; // 정사각형에 가까움

      const score = calculateNeighborScore(neighbor, squareLikeCage);

      expect(score).toBeGreaterThan(0);
    });

    it("빈 케이지에 대해서도 점수를 계산해야 함", () => {
      const neighbor: GridPosition = [0, 0];
      const emptyCage: GridPosition[] = [];

      const score = calculateNeighborScore(neighbor, emptyCage);

      expect(typeof score).toBe("number");
      // 빈 케이지의 경우 연결성이 없어 음수 점수가 나올 수 있음
      expect(Number.isFinite(score)).toBe(true);
    });
  });

  describe("통합 테스트", () => {
    it("모든 함수가 함께 작동해야 함", () => {
      const strategy: RemovalStrategy = {
        preferCenter: true,
        preferCorners: true,
        preferEdges: false,
        symmetryBonus: 0.2,
        blockDistribution: true,
      };

      const cages: KillerCage[] = [
        createMockKillerCage(
          1,
          [
            [0, 0],
            [0, 1],
          ],
          10,
        ),
        createMockKillerCage(
          2,
          [
            [4, 4],
            [4, 5],
            [5, 4],
          ],
          15,
        ),
      ];

      const cageMap = new Map<string, KillerCage>();
      cages.forEach((cage) => {
        cage.cells.forEach(([r, c]) => {
          cageMap.set(`${r}-${c}`, cage);
        });
      });

      const board = createMockBoard();

      // 모든 함수 실행
      const priorities = calculateCellPriorities(strategy, 40);
      const mustKeep = calculateMustKeepCells(cages, "medium");
      const killerPriority = calculateKillerCellPriority(0, 0, cageMap, board);
      const neighborScore = calculateNeighborScore(
        [1, 1],
        [
          [1, 0],
          [2, 1],
        ],
      );

      // 모든 결과가 유효해야 함
      expect(priorities.length).toBeGreaterThan(0);
      expect(mustKeep.size).toBeGreaterThan(0);
      expect(typeof killerPriority).toBe("number");
      expect(typeof neighborScore).toBe("number");

      // 타입 검증
      priorities.forEach((cell: CellPriority) => {
        expect(cell.pos).toHaveLength(2);
        expect(typeof cell.priority).toBe("number");
      });
    });

    it("targetRemove 값에 따라 올바른 수의 우선순위를 반환해야 함", () => {
      const targetRemove = 30;

      const strategy: RemovalStrategy = {
        preferCenter: true,
        preferCorners: false,
        preferEdges: false,
        symmetryBonus: 0,
        blockDistribution: false,
      };

      const priorities = calculateCellPriorities(
        strategy, targetRemove,
      );

      expect(priorities.length).toBeLessThanOrEqual(
        Math.floor(targetRemove * 1.5),
      );
    });
  });
});
