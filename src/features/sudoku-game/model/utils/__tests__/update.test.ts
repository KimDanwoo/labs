import { BOARD_SIZE } from "@entities/board/model/constants";
import { SudokuBoard, SudokuCell } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { KillerCage } from "@entities/game/model/types";
import { describe, expect, it } from "vitest";
import {
  calculateHighlights,
  canFillCell,
  checkGameCompletion,
  clearHighlights,
  findEmptyCells,
  resetUserInputs,
  updateCellNotes,
  updateCellSelection,
  updateCellValue,
  updateSingleCell,
  validateBoard,
} from "../update";

describe("update.ts 유틸리티 함수 테스트", () => {
  // 테스트용 보드 생성 헬퍼 함수
  const createTestBoard = (): SudokuBoard =>
    Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => ({
            value: null,
            notes: [],
            isInitial: false,
            isSelected: false,
            isConflict: false,
          })),
      );

  describe("updateSingleCell", () => {
    it("단일 셀을 성공적으로 업데이트해야 합니다", () => {
      const board = createTestBoard();
      const updates: Partial<SudokuCell> = {
        value: 5,
        notes: [1, 2, 3],
        isSelected: true,
      };

      const updatedBoard = updateSingleCell(board, 0, 0, updates);

      expect(updatedBoard[0][0]).toEqual({
        ...board[0][0],
        ...updates,
      });
      // 다른 셀들은 변경되지 않아야 함
      expect(updatedBoard[0][1]).toEqual(board[0][1]);
      expect(updatedBoard[1][0]).toEqual(board[1][0]);
    });
  });

  describe("updateCellSelection", () => {
    it("선택된 셀만 isSelected가 true가 되어야 합니다", () => {
      const board = createTestBoard();
      const updatedBoard = updateCellSelection(board, 2, 3);

      // 선택된 셀 확인
      expect(updatedBoard[2][3].isSelected).toBe(true);

      // 다른 모든 셀은 false여야 함
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (row !== 2 || col !== 3) {
            expect(updatedBoard[row][col].isSelected).toBe(false);
          }
        }
      }
    });
  });

  describe("updateCellNotes", () => {
    it("셀의 노트를 성공적으로 업데이트해야 합니다", () => {
      const board = createTestBoard();
      const notes = [1, 2, 3];
      const updatedBoard = updateCellNotes(board, 1, 1, notes);

      expect(updatedBoard[1][1].notes).toEqual(notes);
      // 다른 셀들은 변경되지 않아야 함
      expect(updatedBoard[1][1].value).toBeNull();
      expect(updatedBoard[0][0].notes).toEqual([]);
    });
  });

  describe("resetUserInputs", () => {
    it("초기 셀은 유지하면서 사용자 입력을 초기화해야 합니다", () => {
      const board = createTestBoard();
      // 초기 셀 설정
      board[0][0] = { ...board[0][0], isInitial: true, value: 5 };
      // 사용자 입력 설정
      board[1][1] = { ...board[1][1], value: 3, notes: [1, 2], isSelected: true, isConflict: true };

      const resetBoard = resetUserInputs(board);

      // 초기 셀은 값이 유지되어야 함
      expect(resetBoard[0][0].value).toBe(5);
      expect(resetBoard[0][0].isInitial).toBe(true);
      expect(resetBoard[0][0].isSelected).toBe(false);
      expect(resetBoard[0][0].isConflict).toBe(false);

      // 사용자 입력 셀은 초기화되어야 함
      expect(resetBoard[1][1].value).toBeNull();
      expect(resetBoard[1][1].notes).toEqual([]);
      expect(resetBoard[1][1].isSelected).toBe(false);
      expect(resetBoard[1][1].isConflict).toBe(false);
    });
  });

  describe("findEmptyCells", () => {
    it("빈 셀의 위치를 모두 찾아야 합니다", () => {
      const board = createTestBoard();
      // 일부 셀에 값 설정
      board[0][0].value = 1;
      board[1][1].value = 2;

      const emptyCells = findEmptyCells(board);

      // 빈 셀 개수 확인 (전체 셀 - 채워진 셀)
      expect(emptyCells.length).toBe(BOARD_SIZE * BOARD_SIZE - 2);
      // 빈 셀의 위치가 올바른지 확인
      expect(emptyCells).not.toContainEqual({ row: 0, col: 0 });
      expect(emptyCells).not.toContainEqual({ row: 1, col: 1 });
      expect(emptyCells).toContainEqual({ row: 0, col: 1 });
    });
  });

  describe("calculateHighlights", () => {
    it("선택된 셀과 관련된 셀들을 올바르게 하이라이트해야 합니다", () => {
      const board = createTestBoard();
      // 테스트를 위해 일부 셀에 값 설정
      board[0][0].value = 5;
      board[1][1].value = 5; // 같은 값
      board[0][1].value = 3; // 같은 행
      board[1][0].value = 4; // 같은 열

      const highlights = calculateHighlights(board, 0, 0);

      // 선택된 셀 확인
      expect(highlights["0-0"].selected).toBe(true);

      // 같은 행, 열, 블록의 셀들이 related로 마킹되어야 함
      expect(highlights["0-1"].related).toBe(true); // 같은 행
      expect(highlights["1-0"].related).toBe(true); // 같은 열
      expect(highlights["1-1"].related).toBe(true); // 같은 블록

      // 같은 값을 가진 셀이 sameValue로 마킹되어야 함
      expect(highlights["1-1"].sameValue).toBe(true);
    });

    it("변경되지 않은 셀의 하이라이트 객체는 재사용되어야 합니다", () => {
      const board = createTestBoard();

      const firstHighlights = calculateHighlights(board, 0, 0);
      const secondHighlights = calculateHighlights(board, 0, 1, firstHighlights);

      expect(secondHighlights["8-8"]).toBe(firstHighlights["8-8"]);
      expect(secondHighlights["0-0"]).not.toBe(firstHighlights["0-0"]);
      expect(secondHighlights["0-1"]).not.toBe(firstHighlights["0-1"]);
    });
  });

  describe("clearHighlights", () => {
    it("기존 하이라이트 객체 중 변경되지 않은 항목은 재사용해야 합니다", () => {
      const board = createTestBoard();
      const highlights = calculateHighlights(board, 0, 0);

      const cleared = clearHighlights(highlights);

      expect(cleared["0-0"]).not.toBe(highlights["0-0"]);
      expect(cleared["8-8"]).toBe(highlights["8-8"]);
      expect(cleared["0-0"].selected).toBe(false);
      expect(cleared["0-0"].related).toBe(false);
      expect(cleared["0-0"].sameValue).toBe(false);
    });
  });

  describe("canFillCell", () => {
    it("초기 셀이 아닌 경우에만 true를 반환해야 합니다", () => {
      const board = createTestBoard();
      // 초기 셀 설정
      board[0][0].isInitial = true;

      expect(canFillCell({ row: 0, col: 0 }, board)).toBe(false);
      expect(canFillCell({ row: 1, col: 1 }, board)).toBe(true);
      expect(canFillCell(null, board)).toBe(false);
    });
  });

  describe("updateCellValue", () => {
    it("셀의 값을 업데이트하고 노트를 초기화해야 합니다", () => {
      const board = createTestBoard();
      board[0][0].notes = [1, 2, 3];

      const updatedBoard = updateCellValue(board, 0, 0, 5);

      expect(updatedBoard[0][0].value).toBe(5);
      expect(updatedBoard[0][0].notes).toEqual([]);
    });
  });

  describe("validateBoard", () => {
    it("일반 모드에서는 충돌만 검사해야 합니다", () => {
      const board = createTestBoard();
      // 충돌이 있는 보드 설정
      board[0][0].value = 1;
      board[0][1].value = 1; // 같은 행에 중복

      const validatedBoard = validateBoard(board, GAME_MODE.CLASSIC, []);

      expect(validatedBoard[0][0].isConflict).toBe(true);
      expect(validatedBoard[0][1].isConflict).toBe(true);
    });

    it("킬러 모드에서는 케이지 규칙도 검사해야 합니다", () => {
      const board = createTestBoard();
      const cages: KillerCage[] = [
        {
          id: 1,
          cells: [
            [0, 0],
            [0, 1],
          ],
          sum: 3,
        },
      ];

      // 케이지 규칙을 위반하는 값 설정
      board[0][0].value = 1;
      board[0][1].value = 3; // 합이 4가 되어 규칙 위반

      const validatedBoard = validateBoard(board, GAME_MODE.KILLER, cages);

      expect(validatedBoard[0][0].isConflict).toBe(true);
      expect(validatedBoard[0][1].isConflict).toBe(true);
    });
  });

  describe("checkGameCompletion", () => {
    it("보드가 완성되고 정확할 때 success가 true여야 합니다", () => {
      const board = createTestBoard();
      const solution = Array(BOARD_SIZE)
        .fill(null)
        .map(() =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => 2),
        );

      // 보드를 완성된 상태로 설정
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          board[row][col].value = solution[row][col];
        }
      }

      const result = checkGameCompletion(board, solution, GAME_MODE.CLASSIC, []);

      expect(result.completed).toBe(true);
      expect(result.success).toBe(true);
    });

    it("보드가 완성되었지만 정확하지 않을 때 success가 false여야 합니다", () => {
      const board = createTestBoard();
      const solution = Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(1));

      // 보드를 완성되었지만 잘못된 상태로 설정
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          board[row][col].value = 2; // 솔루션과 다른 값
        }
      }

      const result = checkGameCompletion(board, solution, GAME_MODE.CLASSIC, []);

      expect(result.completed).toBe(true);
      expect(result.success).toBe(false);
    });
  });
});
