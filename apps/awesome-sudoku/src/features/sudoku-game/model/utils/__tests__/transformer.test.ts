import { BLOCK_SIZE, BOARD_SIZE } from "@entities/board/model/constants";
import { Grid } from "@entities/board/model/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTransformations } from "../transformer";

describe("transformer.ts 테스트", () => {
  // 헬퍼 함수들
  const createTestGrid = (): Grid =>
    Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_2, col) => ((row * 9 + col) % 9) + 1),
    );

  const createValidSudokuGrid = (): Grid => [
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

  const isValidGridStructure = (grid: Grid): boolean => {
    if (!grid || grid.length !== BOARD_SIZE) return false;

    for (let row = 0; row < BOARD_SIZE; row++) {
      if (!grid[row] || grid[row].length !== BOARD_SIZE) return false;
      for (let col = 0; col < BOARD_SIZE; col++) {
        const value = grid[row][col];
        if (typeof value !== "number" || value < 1 || value > 9) return false;
      }
    }
    return true;
  };

  const hasValidNumberDistribution = (grid: Grid): boolean => {
    const totalCounts = new Map<number, number>();

    // 전체 그리드에서 각 숫자의 개수 세기
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const value = grid[row][col];
        totalCounts.set(value, (totalCounts.get(value) || 0) + 1);
      }
    }

    // 각 숫자가 정확히 9번씩 나타나야 함
    for (let num = 1; num <= 9; num++) {
      if (totalCounts.get(num) !== 9) return false;
    }

    return true;
  };

  const areGridsEqual = (grid1: Grid, grid2: Grid): boolean => {
    if (grid1.length !== grid2.length) return false;

    for (let row = 0; row < grid1.length; row++) {
      if (grid1[row].length !== grid2[row].length) return false;
      for (let col = 0; col < grid1[row].length; col++) {
        if (grid1[row][col] !== grid2[row][col]) return false;
      }
    }

    return true;
  };

  const countDifferences = (grid1: Grid, grid2: Grid): number => {
    let differences = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (grid1[row][col] !== grid2[row][col]) {
          differences++;
        }
      }
    }
    return differences;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Math.random을 예측 가능한 값으로 모킹
    let callCount = 0;
    vi.spyOn(Math, "random").mockImplementation(() => {
      const values = [0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8, 0.15, 0.35, 0.55, 0.75, 0.95];
      return values[callCount++ % values.length];
    });
  });

  describe("applyTransformations", () => {
    it("그리드의 기본 구조를 유지해야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalGrid = structuredClone(grid);

      applyTransformations(grid);

      // 기본 구조 확인
      expect(isValidGridStructure(grid)).toBe(true);
      expect(grid).toHaveLength(BOARD_SIZE);
      expect(grid[0]).toHaveLength(BOARD_SIZE);

      // 원본과 다르게 변경되었는지 확인
      const differences = countDifferences(originalGrid, grid);
      expect(differences).toBeGreaterThan(0);
    });

    it("숫자 분포를 유지해야 한다", () => {
      const grid = createValidSudokuGrid();

      applyTransformations(grid);

      // 각 숫자가 정확히 9번씩 나타나야 함
      expect(hasValidNumberDistribution(grid)).toBe(true);
    });

    it("여러 번 실행해도 안정적이어야 한다", () => {
      const grids = Array.from({ length: 5 }, () => createValidSudokuGrid());

      grids.forEach((grid) => {
        applyTransformations(grid);
        expect(isValidGridStructure(grid)).toBe(true);
        expect(hasValidNumberDistribution(grid)).toBe(true);
      });

      // 각 그리드가 다르게 변환되었는지 확인
      for (let i = 0; i < grids.length - 1; i++) {
        for (let j = i + 1; j < grids.length; j++) {
          const differences = countDifferences(grids[i], grids[j]);
          expect(differences).toBeGreaterThan(0);
        }
      }
    });

    it("모든 유효한 숫자 범위를 유지해야 한다", () => {
      const grid = createValidSudokuGrid();

      applyTransformations(grid);

      grid.forEach((row) => {
        row.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(9);
          expect(Number.isInteger(value)).toBe(true);
        });
      });
    });

    it("빈 그리드가 아닌 채워진 그리드로 작동해야 한다", () => {
      const grid = createTestGrid();

      applyTransformations(grid);

      expect(isValidGridStructure(grid)).toBe(true);

      // 모든 셀이 채워져 있어야 함
      grid.forEach((row) => {
        row.forEach((value) => {
          expect(value).not.toBe(0);
          expect(value).not.toBeNull();
          expect(value).not.toBeUndefined();
        });
      });
    });

    it("변환 후에도 9x9 구조를 유지해야 한다", () => {
      const grid = createValidSudokuGrid();

      applyTransformations(grid);

      expect(grid).toHaveLength(9);
      grid.forEach((row) => {
        expect(row).toHaveLength(9);
      });
    });

    it("동일한 입력에 대해 다른 결과를 생성해야 한다", () => {
      const grid1 = createValidSudokuGrid();
      const grid2 = structuredClone(grid1);

      // Math.random 상태를 다르게 만들기 위해 호출
      Math.random();

      applyTransformations(grid1);
      applyTransformations(grid2);

      // 두 결과가 다르면서도 모두 유효해야 함
      expect(areGridsEqual(grid1, grid2)).toBe(false);
      expect(isValidGridStructure(grid1)).toBe(true);
      expect(isValidGridStructure(grid2)).toBe(true);
    });
  });

  describe("변환 효과 검증", () => {
    it("상당한 변화를 만들어야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalGrid = structuredClone(grid);

      applyTransformations(grid);

      const differences = countDifferences(originalGrid, grid);

      // 최소 절반 이상의 셀이 변경되어야 함
      expect(differences).toBeGreaterThan(40);
    });

    it("변환이 복합적으로 적용되어야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalGrid = structuredClone(grid);

      applyTransformations(grid);

      // 구조적 변환과 숫자 매핑이 함께 적용되므로
      // 원래 같은 숫자였던 위치들이 다른 숫자로 변환될 수 있음
      const originalOnes = [];
      const transformedAtSamePositions = [];

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (originalGrid[row][col] === 1) {
            originalOnes.push({ row, col });
            transformedAtSamePositions.push(grid[row][col]);
          }
        }
      }

      // 변환 후에도 모든 값이 유효한 범위에 있어야 함
      transformedAtSamePositions.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(9);
      });

      // 원래 1이 있던 위치 수는 동일해야 함
      expect(originalOnes).toHaveLength(9);
      expect(transformedAtSamePositions).toHaveLength(9);
    });

    it("3x3 블록 구조 변환이 적용되어야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalGrid = structuredClone(grid);

      applyTransformations(grid);

      // 블록별로 체크 - 완전히 같지는 않지만 구조는 유지되어야 함
      let blockChanges = 0;

      for (let blockRow = 0; blockRow < BLOCK_SIZE; blockRow++) {
        for (let blockCol = 0; blockCol < BLOCK_SIZE; blockCol++) {
          let blockDifferences = 0;

          for (let r = 0; r < BLOCK_SIZE; r++) {
            for (let c = 0; c < BLOCK_SIZE; c++) {
              const row = blockRow * BLOCK_SIZE + r;
              const col = blockCol * BLOCK_SIZE + c;

              if (originalGrid[row][col] !== grid[row][col]) {
                blockDifferences++;
              }
            }
          }

          if (blockDifferences > 0) {
            blockChanges++;
          }
        }
      }

      // 대부분의 블록에서 변화가 있어야 함
      expect(blockChanges).toBeGreaterThan(5);
    });
  });

  describe("성능 및 안정성", () => {
    it("대용량 처리를 빠르게 해야 한다", () => {
      const grid = createValidSudokuGrid();
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const testGrid = structuredClone(grid);
        applyTransformations(testGrid);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100번 실행이 2초 이내에 완료되어야 함
      expect(duration).toBeLessThan(2000);
    });

    it("메모리 효율적이어야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalSize = JSON.stringify(grid).length;

      applyTransformations(grid);

      const finalSize = JSON.stringify(grid).length;

      // 그리드 크기가 크게 변하지 않아야 함
      expect(Math.abs(finalSize - originalSize)).toBeLessThan(originalSize * 0.1);
    });

    it("반복 적용해도 안정적이어야 한다", () => {
      const grid = createValidSudokuGrid();

      // 여러 번 연속으로 변환 적용
      for (let i = 0; i < 10; i++) {
        applyTransformations(grid);

        expect(isValidGridStructure(grid)).toBe(true);
        expect(hasValidNumberDistribution(grid)).toBe(true);
      }
    });

    it("극한 케이스를 처리해야 한다", () => {
      // 모든 값이 1인 그리드
      const grid1 = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(1));

      expect(() => applyTransformations(grid1)).not.toThrow();
      expect(isValidGridStructure(grid1)).toBe(true);

      // 순차적인 값의 그리드
      const grid2 = createTestGrid();

      expect(() => applyTransformations(grid2)).not.toThrow();
      expect(isValidGridStructure(grid2)).toBe(true);
    });
  });

  describe("변환 무작위성", () => {
    it("반복 변환으로 다양한 출력을 생성해야 한다", () => {
      const results: Grid[] = [];

      for (let i = 0; i < 5; i++) {
        const grid = createValidSudokuGrid();

        // 각 반복마다 다른 시드를 만들기 위해 Math.random을 여러 번 호출
        for (let j = 0; j < i * 3; j++) {
          Math.random();
        }

        applyTransformations(grid);
        results.push(grid);
      }

      // 모든 결과가 유효해야 함
      results.forEach((grid) => {
        expect(isValidGridStructure(grid)).toBe(true);
        expect(hasValidNumberDistribution(grid)).toBe(true);
      });

      // 첫 번째와 마지막 결과는 다라야 함 (최소한의 다양성 확인)
      const firstGrid = results[0];
      const lastGrid = results[results.length - 1];
      const differences = countDifferences(firstGrid, lastGrid);

      expect(differences).toBeGreaterThan(0);
    });

    it("충분한 엔트로피를 가져야 한다", () => {
      const grid = createValidSudokuGrid();
      const originalGrid = structuredClone(grid);

      applyTransformations(grid);

      // 첫 번째 행이 완전히 동일하지 않아야 함
      expect(areGridsEqual([originalGrid[0]], [grid[0]])).toBe(false);

      // 첫 번째 열이 완전히 동일하지 않아야 함
      const originalFirstCol = originalGrid.map((row) => row[0]);
      const transformedFirstCol = grid.map((row) => row[0]);
      expect(originalFirstCol).not.toEqual(transformedFirstCol);
    });

    it("모든 숫자가 다양한 위치에 분포되어야 한다", () => {
      const grid = createValidSudokuGrid();

      applyTransformations(grid);

      // 각 숫자가 다양한 행과 열에 나타나는지 확인
      for (let num = 1; num <= 9; num++) {
        const positions = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (grid[row][col] === num) {
              positions.push({ row, col });
            }
          }
        }

        expect(positions).toHaveLength(9);

        // 최소 3개 이상의 다른 행에 나타나야 함
        const uniqueRows = new Set(positions.map((p) => p.row));
        expect(uniqueRows.size).toBeGreaterThanOrEqual(3);

        // 최소 3개 이상의 다른 열에 나타나야 함
        const uniqueCols = new Set(positions.map((p) => p.col));
        expect(uniqueCols.size).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
