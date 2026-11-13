import { atIndex, cellAt } from '@entities/game/lib/gridAccess';
import {
  checkConflicts,
  isBoardComplete,
  isKillerBoardComplete,
  isValidSolution,
  markWrongValues,
  validateKillerCages,
} from '@entities/game/lib/validator';
import { BOARD_SIZE } from '@entities/game/model/constants/board';
import type { Grid, GridPosition, SudokuBoard, SudokuCell } from '@entities/game/model/types/board';
import type { KillerCage } from '@entities/game/model/types/game';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('validator.ts 테스트', () => {
  const createMockSudokuCell = (value: number | null = null, isInitial = false, isConflict = false): SudokuCell => ({
    value,
    isInitial,
    isSelected: false,
    isConflict,
    isHint: false,
    notes: [],
  });

  const createEmptyBoard = (): SudokuBoard =>
    Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => createMockSudokuCell()));

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

  const createValidSudokuBoard = (): SudokuBoard => {
    const grid = createValidSudokuGrid();
    return grid.map((row) => row.map((value) => createMockSudokuCell(value, true)));
  };

  const createMockKillerCage = (id: number, cells: GridPosition[], sum: number): KillerCage => ({
    id,
    cells,
    sum,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('충돌 검사 함수들', () => {
    describe('checkConflicts', () => {
      it('충돌이 없는 보드에서는 모든 셀이 conflict: false여야 한다', () => {
        const board = createValidSudokuBoard();

        const result = checkConflicts(board);

        result.forEach((row) => {
          row.forEach((cell) => {
            expect(cell.isConflict).toBe(false);
          });
        });
      });

      it('행 충돌을 감지하고 표시해야 한다', () => {
        const board = createEmptyBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(5, true);
        atIndex(board, 0)[5] = createMockSudokuCell(5, true);

        const result = checkConflicts(board);

        expect(cellAt(result, 0, 0).isConflict).toBe(true);
        expect(cellAt(result, 0, 5).isConflict).toBe(true);
        expect(cellAt(result, 0, 1).isConflict).toBe(false);
      });

      it('열 충돌을 감지하고 표시해야 한다', () => {
        const board = createEmptyBoard();
        atIndex(board, 0)[1] = createMockSudokuCell(3, true);
        atIndex(board, 5)[1] = createMockSudokuCell(3, true);

        const result = checkConflicts(board);

        expect(cellAt(result, 0, 1).isConflict).toBe(true);
        expect(cellAt(result, 5, 1).isConflict).toBe(true);
        expect(cellAt(result, 1, 1).isConflict).toBe(false);
      });

      it('블록 충돌을 감지하고 표시해야 한다', () => {
        const board = createEmptyBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(8, true);
        atIndex(board, 2)[2] = createMockSudokuCell(8, true);

        const result = checkConflicts(board);

        expect(cellAt(result, 0, 0).isConflict).toBe(true);
        expect(cellAt(result, 2, 2).isConflict).toBe(true);
        expect(cellAt(result, 1, 1).isConflict).toBe(false);
      });

      it('여러 종류의 충돌을 동시에 감지해야 한다', () => {
        const board = createEmptyBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(1, true);
        atIndex(board, 0)[1] = createMockSudokuCell(1, true);
        atIndex(board, 1)[0] = createMockSudokuCell(1, true);

        const result = checkConflicts(board);

        expect(cellAt(result, 0, 0).isConflict).toBe(true);
        expect(cellAt(result, 0, 1).isConflict).toBe(true);
        expect(cellAt(result, 1, 0).isConflict).toBe(true);
      });

      it('null 값은 충돌 검사에서 제외해야 한다', () => {
        const board = createEmptyBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(null, false);
        atIndex(board, 0)[1] = createMockSudokuCell(null, false);

        const result = checkConflicts(board);

        expect(cellAt(result, 0, 0).isConflict).toBe(false);
        expect(cellAt(result, 0, 1).isConflict).toBe(false);
      });
    });
  });

  describe('보드 완성도 및 정확성 검사', () => {
    describe('isBoardComplete', () => {
      it('모든 셀이 채워지고 충돌이 없으면 완성으로 판단해야 한다', () => {
        const board = createValidSudokuBoard();

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(true);
      });

      it('빈 셀이 있으면 미완성으로 판단해야 한다', () => {
        const board = createValidSudokuBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(null);

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });

      it('충돌이 있으면 미완성으로 판단해야 한다', () => {
        const board = createValidSudokuBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(5, true, true);

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });

      it('빈 보드는 미완성으로 판단해야 한다', () => {
        const board = createEmptyBoard();

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });
    });
  });

  describe('isValidSolution', () => {
    it('행·열·블록에 1~9가 한 번씩 있으면 유효하다', () => {
      expect(isValidSolution(createValidSudokuGrid())).toBe(true);
    });

    it('한 칸만 바꿔 중복이 생기면 무효다', () => {
      const grid = createValidSudokuGrid();
      atIndex(grid, 0)[0] = cellAt(grid, 0, 1);
      expect(isValidSolution(grid)).toBe(false);
    });
  });

  describe('markWrongValues', () => {
    it('정답과 다른 사용자 값은 충돌로 표시한다', () => {
      const solution = createValidSudokuGrid();
      const board = createEmptyBoard();
      atIndex(board, 0)[0] = createMockSudokuCell(cellAt(solution, 0, 0) === 9 ? 1 : 9);

      expect(cellAt(markWrongValues(board, solution), 0, 0).isConflict).toBe(true);
    });

    it('정답과 같은 값·빈 칸·초기 셀은 건드리지 않는다', () => {
      const solution = createValidSudokuGrid();
      const board = createEmptyBoard();
      atIndex(board, 0)[0] = createMockSudokuCell(cellAt(solution, 0, 0));
      atIndex(board, 0)[2] = createMockSudokuCell(cellAt(solution, 0, 2) === 9 ? 1 : 9, true);

      const marked = markWrongValues(board, solution);
      expect(cellAt(marked, 0, 0).isConflict).toBe(false);
      expect(cellAt(marked, 0, 1).isConflict).toBe(false);
      expect(cellAt(marked, 0, 2).isConflict).toBe(false);
      expect(cellAt(marked, 0, 1)).toBe(cellAt(board, 0, 1));
    });
  });

  describe('킬러 스도쿠 검증', () => {
    describe('validateKillerCages', () => {
      it('킬러 스도쿠 보드의 케이지 규칙을 검증해야 한다', () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            8,
          ),
          createMockKillerCage(
            2,
            [
              [1, 0],
              [1, 1],
            ],
            13,
          ),
        ];

        const result = validateKillerCages(board, cages);

        expect(cellAt(result, 0, 0).isConflict).toBe(false);
        expect(cellAt(result, 0, 1).isConflict).toBe(false);
      });

      it('케이지 합계 오류를 감지해야 한다', () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            10,
          ),
        ];

        const result = validateKillerCages(board, cages);

        expect(cellAt(result, 0, 0).isConflict).toBe(true);
        expect(cellAt(result, 0, 1).isConflict).toBe(true);
      });
    });

    describe('isKillerBoardComplete', () => {
      it('올바르게 완성된 킬러 보드를 인식해야 한다', () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            8,
          ),
          createMockKillerCage(
            2,
            [
              [1, 0],
              [1, 1],
            ],
            13,
          ),
        ];

        let cageId = 3;
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (!((row === 0 && (col === 0 || col === 1)) || (row === 1 && (col === 0 || col === 1)))) {
              const value = cellAt(board, row, col).value!;
              cages.push(createMockKillerCage(cageId++, [[row, col]], value));
            }
          }
        }

        const isComplete = isKillerBoardComplete(board, cages);
        expect(isComplete).toBe(true);
      });

      it('빈 셀이 있는 킬러 보드를 미완성으로 판단해야 한다', () => {
        const board = createValidSudokuBoard();
        atIndex(board, 0)[0] = createMockSudokuCell(null);

        const cages: KillerCage[] = [createMockKillerCage(1, [[0, 0]], 5)];

        const isComplete = isKillerBoardComplete(board, cages);
        expect(isComplete).toBe(false);
      });
    });
  });

  describe('통합 테스트', () => {
    it('전체 검증 파이프라인이 올바르게 작동해야 한다', () => {
      const solution = createValidSudokuGrid();
      const board = createValidSudokuBoard();

      expect(isValidSolution(solution)).toBe(true);

      expect(isBoardComplete(board)).toBe(true);

      expect(
        markWrongValues(board, solution)
          .flat()
          .some((cell) => cell.isConflict),
      ).toBe(false);

      const checkedBoard = checkConflicts(board);
      const hasAnyConflict = checkedBoard.some((row) => row.some((cell) => cell.isConflict));
      expect(hasAnyConflict).toBe(false);
    });

    it('잘못된 보드는 모든 검증 단계에서 감지되어야 한다', () => {
      const board = createValidSudokuBoard();

      atIndex(board, 0)[0] = createMockSudokuCell(cellAt(board, 0, 1).value);

      const checkedBoard = checkConflicts(board);
      expect(cellAt(checkedBoard, 0, 0).isConflict).toBe(true);
      expect(cellAt(checkedBoard, 0, 1).isConflict).toBe(true);

      expect(isBoardComplete(checkedBoard)).toBe(false);
    });
  });
});
