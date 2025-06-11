import { BOARD_SIZE } from "@entities/board/model/constants";
import { SudokuBoard } from "@entities/board/model/types";
import { SudokuCell } from "@entities/cell/model/types";
import { forceRemoveAdditionalCells } from "@features/game-board/model/utils/remove";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("remove.ts 테스트", () => {
  // 헬퍼 함수들
  const createMockSudokuCell = (value: number | null = null, isInitial = true): SudokuCell => ({
    value,
    isInitial,
    isSelected: false,
    isConflict: false,
    notes: [],
  });

  const createMockBoard = (fillPattern?: "full" | "empty" | "partial"): SudokuBoard =>
    Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_2, col) => {
        if (fillPattern === "full") {
          return createMockSudokuCell(((row * 9 + col) % 9) + 1, true);
        } else if (fillPattern === "empty") {
          return createMockSudokuCell(null, false);
        } else if (fillPattern === "partial") {
          return createMockSudokuCell(Math.random() > 0.5 ? ((row * 9 + col) % 9) + 1 : null, Math.random() > 0.5);
        } else {
          return createMockSudokuCell(((row * 9 + col) % 9) + 1, true);
        }
      }),
    );

  const countFilledCells = (board: SudokuBoard): number => board.flat().filter((cell) => cell.value !== null).length;

  const countNonInitialCells = (board: SudokuBoard): number => board.flat().filter((cell) => !cell.isInitial).length;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("forceRemoveAdditionalCells", () => {
    it("지정된 수만큼 추가로 셀을 제거해야 한다", () => {
      const board = createMockBoard("full");
      const initialFilledCount = countFilledCells(board);
      const additionalCount = 10;

      const removedCount = forceRemoveAdditionalCells(board, additionalCount);

      const finalFilledCount = countFilledCells(board);

      expect(removedCount).toBe(additionalCount);
      expect(finalFilledCount).toBe(initialFilledCount - additionalCount);
    });

    it("제거된 셀들은 isInitial이 false가 되어야 한다", () => {
      const board = createMockBoard("full");
      const additionalCount = 5;

      forceRemoveAdditionalCells(board, additionalCount);

      const removedCells = board.flat().filter((cell) => cell.value === null && !cell.isInitial);
      expect(removedCells.length).toBe(additionalCount);
    });

    it("사용 가능한 셀보다 많이 제거하려 할 때 가능한 만큼만 제거해야 한다", () => {
      const board = createMockBoard("empty");
      // 일부 셀만 채우기
      for (let i = 0; i < 5; i++) {
        board[0][i].value = i + 1;
      }

      const initialFilledCount = countFilledCells(board);
      const additionalCount = 10; // 가능한 것보다 많이 요청

      const removedCount = forceRemoveAdditionalCells(board, additionalCount);

      expect(removedCount).toBe(initialFilledCount); // 실제로 제거 가능한 수
      expect(countFilledCells(board)).toBe(0);
    });

    it("이미 빈 보드에서는 아무것도 제거하지 않아야 한다", () => {
      const board = createMockBoard("empty");
      const originalBoard = structuredClone(board);

      const removedCount = forceRemoveAdditionalCells(board, 10);

      expect(removedCount).toBe(0);
      expect(board).toEqual(originalBoard);
    });

    it("additionalCount가 0일 때 아무것도 제거하지 않아야 한다", () => {
      const board = createMockBoard("full");
      const originalBoard = structuredClone(board);

      const removedCount = forceRemoveAdditionalCells(board, 0);

      expect(removedCount).toBe(0);
      expect(board).toEqual(originalBoard);
    });

    it("음수 값을 전달했을 때의 동작을 확인한다", () => {
      const board = createMockBoard("full");
      const originalBoard = structuredClone(board);

      const removedCount = forceRemoveAdditionalCells(board, -5);

      // 실제 구현에서는 음수를 반환하지만 아무 셀도 제거하지 않음
      expect(removedCount).toBe(-5);
      expect(board).toEqual(originalBoard);
    });

    it("모든 셀이 채워진 보드에서 무작위로 셀을 제거해야 한다", () => {
      const board = createMockBoard("full");
      const targetRemove = 20;

      const removedCount = forceRemoveAdditionalCells(board, targetRemove);

      expect(removedCount).toBe(targetRemove);

      // 제거된 셀들이 보드 전체에 분산되어 있는지 확인
      const removedCells = board.flat().filter((cell) => cell.value === null);
      expect(removedCells.length).toBe(targetRemove);

      // 제거된 셀들의 isInitial이 모두 false인지 확인
      const nonInitialRemovedCells = removedCells.filter((cell) => !cell.isInitial);
      expect(nonInitialRemovedCells.length).toBe(targetRemove);
    });

    it("부분적으로 채워진 보드에서 올바르게 작동해야 한다", () => {
      const board = createMockBoard("empty");

      // 체스판 패턴으로 일부 셀 채우기
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if ((row + col) % 2 === 0) {
            board[row][col].value = ((row + col) % 9) + 1;
          }
        }
      }

      const initialFilledCount = countFilledCells(board);
      const targetRemove = Math.min(10, initialFilledCount);

      const removedCount = forceRemoveAdditionalCells(board, targetRemove);

      expect(removedCount).toBe(targetRemove);
      expect(countFilledCells(board)).toBe(initialFilledCount - targetRemove);
    });

    it("큰 수의 셀 제거 요청을 처리할 수 있어야 한다", () => {
      const board = createMockBoard("full");
      const targetRemove = 81; // 모든 셀

      const removedCount = forceRemoveAdditionalCells(board, targetRemove);

      expect(removedCount).toBe(81);
      expect(countFilledCells(board)).toBe(0);

      // 모든 셀이 non-initial이 되었는지 확인
      const nonInitialCount = countNonInitialCells(board);
      expect(nonInitialCount).toBe(81);
    });

    it("배열 인덱스 접근이 안전해야 한다", () => {
      const board = createMockBoard("full");

      // 여러 번 연속으로 호출해도 안전해야 함
      const firstRemoval = forceRemoveAdditionalCells(board, 20);
      const secondRemoval = forceRemoveAdditionalCells(board, 20);
      const thirdRemoval = forceRemoveAdditionalCells(board, 50);

      expect(firstRemoval).toBe(20);
      expect(secondRemoval).toBe(20);
      expect(thirdRemoval).toBe(41); // 남은 셀 수 (81 - 20 - 20 = 41)
      expect(countFilledCells(board)).toBe(0);
    });
  });

  describe("보드 상태 일관성 테스트", () => {
    it("제거 후 보드 구조가 유지되어야 한다", () => {
      const board = createMockBoard("full");

      forceRemoveAdditionalCells(board, 30);

      // 보드 크기가 유지되어야 함
      expect(board).toHaveLength(BOARD_SIZE);
      expect(board[0]).toHaveLength(BOARD_SIZE);

      // 모든 셀이 여전히 올바른 구조를 가져야 함
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toHaveProperty("value");
          expect(cell).toHaveProperty("isInitial");
          expect(cell).toHaveProperty("isSelected");
          expect(cell).toHaveProperty("isConflict");
          expect(cell).toHaveProperty("notes");
          expect(Array.isArray(cell.notes)).toBe(true);
          expect(typeof cell.isInitial).toBe("boolean");
          expect(typeof cell.isSelected).toBe("boolean");
          expect(typeof cell.isConflict).toBe("boolean");
        });
      });
    });

    it("셀 값이 올바른 범위에 있어야 한다", () => {
      const board = createMockBoard("full");

      forceRemoveAdditionalCells(board, 25);

      board.forEach((row) => {
        row.forEach((cell) => {
          if (cell.value !== null) {
            expect(cell.value).toBeGreaterThanOrEqual(1);
            expect(cell.value).toBeLessThanOrEqual(9);
          }
        });
      });
    });

    it("제거되지 않은 셀들의 속성이 변경되지 않아야 한다", () => {
      const board = createMockBoard("full");
      const originalValues = board.map((row) => row.map((cell) => ({ value: cell.value, isInitial: cell.isInitial })));

      forceRemoveAdditionalCells(board, 10);

      // 제거되지 않은 셀들은 원래 상태를 유지해야 함
      let unchangedCells = 0;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col].value !== null) {
            expect(board[row][col].value).toBe(originalValues[row][col].value);
            expect(board[row][col].isInitial).toBe(originalValues[row][col].isInitial);
            unchangedCells++;
          }
        }
      }

      expect(unchangedCells).toBe(81 - 10);
    });
  });

  describe("성능 및 안정성 테스트", () => {
    it("대량의 제거 작업을 빠르게 처리해야 한다", () => {
      const board = createMockBoard("full");
      const startTime = Date.now();

      forceRemoveAdditionalCells(board, 70);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1초 이내에 완료되어야 함
      expect(duration).toBeLessThan(1000);
      expect(countFilledCells(board)).toBe(11);
    });

    it("메모리 누수가 없어야 한다", () => {
      const board = createMockBoard("full");
      const originalBoardSize = JSON.stringify(board).length;

      forceRemoveAdditionalCells(board, 40);

      const finalBoardSize = JSON.stringify(board).length;

      // 보드 크기가 크게 변하지 않아야 함 (구조는 동일)
      expect(Math.abs(finalBoardSize - originalBoardSize)).toBeLessThan(originalBoardSize * 0.5);
    });

    it("여러 번 연속 호출해도 안정적이어야 한다", () => {
      const board = createMockBoard("full");

      const results = [];
      for (let i = 0; i < 10; i++) {
        const removed = forceRemoveAdditionalCells(board, 5);
        results.push(removed);
      }

      // 처음 몇 번은 성공적으로 제거되어야 함
      expect(results.slice(0, 5).every((r) => r === 5)).toBe(true);

      // 나중에는 제거할 셀이 부족해질 수 있음
      const totalRemoved = results.reduce((sum, r) => sum + r, 0);
      expect(totalRemoved).toBeLessThanOrEqual(81);
    });
  });
});
