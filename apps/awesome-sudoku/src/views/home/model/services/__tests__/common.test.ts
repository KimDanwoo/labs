import { BOARD_SIZE } from '@views/home/config/board';
import { atIndex, cellAt } from '@views/home/lib/gridAccess';
import { createEmptyBoard, createEmptyHighlights, shuffleArray } from '@views/home/model/services/common';
import { describe, expect, test } from 'vitest';

describe('스도쿠 유틸리티 함수 테스트', () => {
  describe('shuffleArray', () => {
    test('배열을 섞어야 한다', () => {
      const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const arrayToShuffle = [...originalArray];

      shuffleArray(arrayToShuffle);

      expect(arrayToShuffle).toHaveLength(originalArray.length);

      expect(arrayToShuffle.sort()).toEqual(originalArray);

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

    test('빈 배열을 처리해야 한다', () => {
      const emptyArray: number[] = [];
      shuffleArray(emptyArray);
      expect(emptyArray).toEqual([]);
    });

    test('단일 요소 배열을 처리해야 한다', () => {
      const singleArray = [42];
      shuffleArray(singleArray);
      expect(singleArray).toEqual([42]);
    });

    test('두 요소 배열을 처리해야 한다', () => {
      const twoElementArray = [1, 2];
      const original = [...twoElementArray];
      shuffleArray(twoElementArray);

      expect(twoElementArray).toHaveLength(2);
      expect(twoElementArray.sort()).toEqual(original);
    });
  });

  describe('createEmptyBoard', () => {
    test('올바른 크기의 보드를 생성해야 한다', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(BOARD_SIZE);
      expect(board[0]).toHaveLength(BOARD_SIZE);
    });

    test('모든 셀이 올바른 초기값을 가져야 한다', () => {
      const board = createEmptyBoard();

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = cellAt(board, row, col);
          expect(cell.value).toBeNull();
          expect(cell.isInitial).toBe(false);
          expect(cell.isSelected).toBe(false);
          expect(cell.isConflict).toBe(false);
          expect(cell.notes).toEqual([]);
        }
      }
    });

    test('각 행과 열이 독립적인 배열이어야 한다', () => {
      const board = createEmptyBoard();

      cellAt(board, 0, 0).value = 5;
      expect(cellAt(board, 0, 1).value).toBeNull();
      expect(cellAt(board, 1, 0).value).toBeNull();
    });
  });

  describe('createEmptyHighlights', () => {
    test('올바른 수의 하이라이트를 생성해야 한다', () => {
      const highlights = createEmptyHighlights();
      const expectedCount = BOARD_SIZE * BOARD_SIZE;
      expect(Object.keys(highlights)).toHaveLength(expectedCount);
    });

    test('올바른 키 형식을 사용해야 한다', () => {
      const highlights = createEmptyHighlights();

      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const key = `${row}-${col}`;
          expect(highlights[key]).toBeDefined();
        }
      }
    });

    test('모든 하이라이트가 올바른 초기값을 가져야 한다', () => {
      const highlights = createEmptyHighlights();

      Object.values(highlights).forEach((highlight) => {
        expect(highlight.selected).toBe(false);
        expect(highlight.related).toBe(false);
        expect(highlight.sameValue).toBe(false);
      });
    });

    test('특정 위치의 하이라이트에 접근할 수 있어야 한다', () => {
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

    test('경계값 위치의 하이라이트를 올바르게 생성해야 한다', () => {
      const highlights = createEmptyHighlights();

      expect(highlights['0-0']).toBeDefined();

      const lastIndex = BOARD_SIZE - 1;
      expect(highlights[`${lastIndex}-${lastIndex}`]).toBeDefined();

      expect(highlights[`0-${lastIndex}`]).toBeDefined();
      expect(highlights[`${lastIndex}-0`]).toBeDefined();
    });
  });
});

describe('유틸리티 함수 통합 테스트', () => {
  test('빈 보드와 빈 하이라이트의 크기가 일치해야 한다', () => {
    const board = createEmptyBoard();
    const highlights = createEmptyHighlights();

    const boardCellCount = board.length * atIndex(board, 0).length;
    const highlightCount = Object.keys(highlights).length;

    expect(boardCellCount).toBe(highlightCount);
  });
});
