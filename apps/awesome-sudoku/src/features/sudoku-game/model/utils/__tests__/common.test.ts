import { BOARD_SIZE } from "@entities/board/model/constants";
import {
  createEmptyBoard,
  createEmptyHighlights,
  formatTime,
  shuffleArray,
} from "@features/sudoku-game/model/utils/common";
import { describe, expect, test } from "vitest";

describe("스도쿠 유틸리티 함수 테스트", () => {
  describe("shuffleArray", () => {
    test("배열을 섞어야 한다", () => {
      const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const arrayToShuffle = [...originalArray];

      shuffleArray(arrayToShuffle);

      // 길이는 동일해야 함
      expect(arrayToShuffle).toHaveLength(originalArray.length);

      // 모든 원소가 보존되어야 함
      expect(arrayToShuffle.sort()).toEqual(originalArray);

      // 원본 배열과 다르게 섞였을 가능성이 높음 (완전히 같을 수도 있지만 매우 낮은 확률)
      // 여러 번 테스트해서 최소 한 번은 달라야 함
      let isDifferent = false;
      for (let i = 0; i < 10; i++) {
        const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(testArray);
        if (JSON.stringify(testArray) !== JSON.stringify(originalArray)) {
          isDifferent = true;
          break;
        }
      }
      expect(isDifferent).toBe(true);
    });

    test("빈 배열을 처리해야 한다", () => {
      const emptyArray: number[] = [];
      shuffleArray(emptyArray);
      expect(emptyArray).toEqual([]);
    });

    test("단일 요소 배열을 처리해야 한다", () => {
      const singleArray = [42];
      shuffleArray(singleArray);
      expect(singleArray).toEqual([42]);
    });

    test("두 요소 배열을 처리해야 한다", () => {
      const twoElementArray = [1, 2];
      const original = [...twoElementArray];
      shuffleArray(twoElementArray);

      expect(twoElementArray).toHaveLength(2);
      expect(twoElementArray.sort()).toEqual(original);
    });
  });

  describe("formatTime", () => {
    test("0초를 올바르게 포맷팅해야 한다", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    test("59초 이하를 올바르게 포맷팅해야 한다", () => {
      expect(formatTime(5)).toBe("00:05");
      expect(formatTime(30)).toBe("00:30");
      expect(formatTime(59)).toBe("00:59");
    });

    test("정확히 1분을 올바르게 포맷팅해야 한다", () => {
      expect(formatTime(60)).toBe("01:00");
    });

    test("1분 이상을 올바르게 포맷팅해야 한다", () => {
      expect(formatTime(65)).toBe("01:05");
      expect(formatTime(125)).toBe("02:05");
      expect(formatTime(3661)).toBe("61:01"); // 61분 1초
    });

    test("긴 시간을 올바르게 포맷팅해야 한다", () => {
      expect(formatTime(3599)).toBe("59:59");
      expect(formatTime(3600)).toBe("60:00");
    });

    test("한 자리 숫자를 두 자리로 패딩해야 한다", () => {
      expect(formatTime(9)).toBe("00:09");
      expect(formatTime(69)).toBe("01:09");
    });
  });

  describe("createEmptyBoard", () => {
    test("올바른 크기의 보드를 생성해야 한다", () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(BOARD_SIZE);
      expect(board[0]).toHaveLength(BOARD_SIZE);
    });

    test("모든 셀이 올바른 초기값을 가져야 한다", () => {
      const board = createEmptyBoard();

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = board[row][col];
          expect(cell.value).toBeNull();
          expect(cell.isInitial).toBe(false);
          expect(cell.isSelected).toBe(false);
          expect(cell.isConflict).toBe(false);
          expect(cell.notes).toEqual([]);
        }
      }
    });

    test("각 행과 열이 독립적인 배열이어야 한다", () => {
      const board = createEmptyBoard();

      // 한 셀을 수정해도 다른 셀에 영향을 주지 않아야 함
      board[0][0].value = 5;
      expect(board[0][1].value).toBeNull();
      expect(board[1][0].value).toBeNull();
    });
  });

  describe("createEmptyHighlights", () => {
    test("올바른 수의 하이라이트를 생성해야 한다", () => {
      const highlights = createEmptyHighlights();
      const expectedCount = BOARD_SIZE * BOARD_SIZE;
      expect(Object.keys(highlights)).toHaveLength(expectedCount);
    });

    test("올바른 키 형식을 사용해야 한다", () => {
      const highlights = createEmptyHighlights();

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const key = `${row}-${col}`;
          expect(highlights[key]).toBeDefined();
        }
      }
    });

    test("모든 하이라이트가 올바른 초기값을 가져야 한다", () => {
      const highlights = createEmptyHighlights();

      Object.values(highlights).forEach((highlight) => {
        expect(highlight.selected).toBe(false);
        expect(highlight.related).toBe(false);
        expect(highlight.sameValue).toBe(false);
      });
    });

    test("특정 위치의 하이라이트에 접근할 수 있어야 한다", () => {
      const highlights = createEmptyHighlights();

      const testRow = 3;
      const testCol = 7;
      const key = `${testRow}-${testCol}`;

      expect(highlights[key]).toEqual({
        selected: false,
        related: false,
        sameValue: false,
      });
    });

    test("경계값 위치의 하이라이트를 올바르게 생성해야 한다", () => {
      const highlights = createEmptyHighlights();

      // 첫 번째 셀
      expect(highlights["0-0"]).toBeDefined();

      // 마지막 셀
      const lastIndex = BOARD_SIZE - 1;
      expect(highlights[`${lastIndex}-${lastIndex}`]).toBeDefined();

      // 모서리 셀들
      expect(highlights[`0-${lastIndex}`]).toBeDefined();
      expect(highlights[`${lastIndex}-0`]).toBeDefined();
    });
  });
});

// 통합 테스트
describe("유틸리티 함수 통합 테스트", () => {
  test("빈 보드와 빈 하이라이트의 크기가 일치해야 한다", () => {
    const board = createEmptyBoard();
    const highlights = createEmptyHighlights();

    const boardCellCount = board.length * board[0].length;
    const highlightCount = Object.keys(highlights).length;

    expect(boardCellCount).toBe(highlightCount);
  });

  test("다양한 시간 값들이 올바르게 포맷팅되어야 한다", () => {
    const testCases = [
      { input: 0, expected: "00:00" },
      { input: 1, expected: "00:01" },
      { input: 59, expected: "00:59" },
      { input: 60, expected: "01:00" },
      { input: 61, expected: "01:01" },
      { input: 3661, expected: "61:01" },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(formatTime(input)).toBe(expected);
    });
  });
});
