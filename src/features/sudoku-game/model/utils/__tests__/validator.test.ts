import { BOARD_SIZE } from "@entities/board/model/constants";
import { Grid, GridPosition, SudokuBoard, SudokuCell } from "@entities/board/model/types";
import { KillerCage } from "@entities/game/model/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkBlockConflict,
  checkColConflict,
  checkConflicts,
  checkRowConflict,
  hasUniqueSolution,
  isBoardComplete,
  isBoardCorrect,
  isKillerBoardComplete,
  isKillerRemovalValid,
  isKillerRemovalValidLenient,
  isValidPlacement,
  validateAllCages,
  validateBaseGrid,
  validateCages,
  validateKillerCages,
} from "../validator";

describe("validator.ts 테스트", () => {
  // 헬퍼 함수들
  const createMockSudokuCell = (value: number | null = null, isInitial = false, isConflict = false): SudokuCell => ({
    value,
    isInitial,
    isSelected: false,
    isConflict,
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

  describe("충돌 검사 함수들", () => {
    describe("checkRowConflict", () => {
      it("행에 동일한 값이 있으면 충돌을 감지해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5);
        board[0][3] = createMockSudokuCell(5); // 같은 행에 중복

        const hasConflict = checkRowConflict(board, 0, 1, 5);
        expect(hasConflict).toBe(true);
      });

      it("행에 동일한 값이 없으면 충돌을 감지하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5);
        board[0][3] = createMockSudokuCell(3);

        const hasConflict = checkRowConflict(board, 0, 1, 7);
        expect(hasConflict).toBe(false);
      });

      it("같은 위치는 검사하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][1] = createMockSudokuCell(5);

        const hasConflict = checkRowConflict(board, 0, 1, 5);
        expect(hasConflict).toBe(false);
      });

      it("null 값은 충돌을 일으키지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(null);
        board[0][3] = createMockSudokuCell(null);

        const hasConflict = checkRowConflict(board, 0, 1, 5);
        expect(hasConflict).toBe(false);
      });
    });

    describe("checkColConflict", () => {
      it("열에 동일한 값이 있으면 충돌을 감지해야 한다", () => {
        const board = createEmptyBoard();
        board[0][1] = createMockSudokuCell(5);
        board[3][1] = createMockSudokuCell(5); // 같은 열에 중복

        const hasConflict = checkColConflict(board, 2, 1, 5);
        expect(hasConflict).toBe(true);
      });

      it("열에 동일한 값이 없으면 충돌을 감지하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][1] = createMockSudokuCell(5);
        board[3][1] = createMockSudokuCell(3);

        const hasConflict = checkColConflict(board, 2, 1, 7);
        expect(hasConflict).toBe(false);
      });

      it("같은 위치는 검사하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[2][1] = createMockSudokuCell(5);

        const hasConflict = checkColConflict(board, 2, 1, 5);
        expect(hasConflict).toBe(false);
      });
    });

    describe("checkBlockConflict", () => {
      it("3x3 블록에 동일한 값이 있으면 충돌을 감지해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5);
        board[1][1] = createMockSudokuCell(5); // 같은 블록에 중복

        const hasConflict = checkBlockConflict(board, 0, 2, 5);
        expect(hasConflict).toBe(true);
      });

      it("3x3 블록에 동일한 값이 없으면 충돌을 감지하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5);
        board[1][1] = createMockSudokuCell(3);

        const hasConflict = checkBlockConflict(board, 0, 2, 7);
        expect(hasConflict).toBe(false);
      });

      it("다른 블록은 검사하지 않아야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5); // 첫 번째 블록 (0,0)
        board[3][3] = createMockSudokuCell(5); // 중앙 블록 (1,1)

        // 중앙 블록의 다른 위치에서 5를 체크 - 첫 번째 블록의 5는 영향 없어야 함
        const hasConflict = checkBlockConflict(board, 4, 4, 5);
        expect(hasConflict).toBe(true); // 같은 중앙 블록에 이미 5가 있으므로 충돌

        // 세 번째 블록에서 5를 체크 - 다른 블록들의 5는 영향 없어야 함
        const hasConflictThirdBlock = checkBlockConflict(board, 0, 6, 5);
        expect(hasConflictThirdBlock).toBe(false);
      });

      it("모든 9개 블록에서 올바르게 작동해야 한다", () => {
        const board = createEmptyBoard();

        // 각 블록에서 테스트
        for (let blockRow = 0; blockRow < 3; blockRow++) {
          for (let blockCol = 0; blockCol < 3; blockCol++) {
            const row1 = blockRow * 3;
            const col1 = blockCol * 3;
            const row2 = blockRow * 3 + 1;
            const col2 = blockCol * 3 + 1;

            board[row1][col1] = createMockSudokuCell(7);
            const hasConflict = checkBlockConflict(board, row2, col2, 7);
            expect(hasConflict).toBe(true);

            // 정리
            board[row1][col1] = createMockSudokuCell(null);
          }
        }
      });
    });

    describe("checkConflicts", () => {
      it("충돌이 없는 보드에서는 모든 셀이 conflict: false여야 한다", () => {
        const board = createValidSudokuBoard();

        const result = checkConflicts(board);

        result.forEach((row) => {
          row.forEach((cell) => {
            expect(cell.isConflict).toBe(false);
          });
        });
      });

      it("행 충돌을 감지하고 표시해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(5, true);
        board[0][5] = createMockSudokuCell(5, true); // 같은 행에 중복

        const result = checkConflicts(board);

        expect(result[0][0].isConflict).toBe(true);
        expect(result[0][5].isConflict).toBe(true);
        expect(result[0][1].isConflict).toBe(false);
      });

      it("열 충돌을 감지하고 표시해야 한다", () => {
        const board = createEmptyBoard();
        board[0][1] = createMockSudokuCell(3, true);
        board[5][1] = createMockSudokuCell(3, true); // 같은 열에 중복

        const result = checkConflicts(board);

        expect(result[0][1].isConflict).toBe(true);
        expect(result[5][1].isConflict).toBe(true);
        expect(result[1][1].isConflict).toBe(false);
      });

      it("블록 충돌을 감지하고 표시해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(8, true);
        board[2][2] = createMockSudokuCell(8, true); // 같은 블록에 중복

        const result = checkConflicts(board);

        expect(result[0][0].isConflict).toBe(true);
        expect(result[2][2].isConflict).toBe(true);
        expect(result[1][1].isConflict).toBe(false);
      });

      it("여러 종류의 충돌을 동시에 감지해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(1, true);
        board[0][1] = createMockSudokuCell(1, true); // 행 충돌
        board[1][0] = createMockSudokuCell(1, true); // 열 및 블록 충돌

        const result = checkConflicts(board);

        expect(result[0][0].isConflict).toBe(true);
        expect(result[0][1].isConflict).toBe(true);
        expect(result[1][0].isConflict).toBe(true);
      });

      it("null 값은 충돌 검사에서 제외해야 한다", () => {
        const board = createEmptyBoard();
        board[0][0] = createMockSudokuCell(null, false);
        board[0][1] = createMockSudokuCell(null, false);

        const result = checkConflicts(board);

        expect(result[0][0].isConflict).toBe(false);
        expect(result[0][1].isConflict).toBe(false);
      });
    });
  });

  describe("보드 완성도 및 정확성 검사", () => {
    describe("isBoardComplete", () => {
      it("모든 셀이 채워지고 충돌이 없으면 완성으로 판단해야 한다", () => {
        const board = createValidSudokuBoard();

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(true);
      });

      it("빈 셀이 있으면 미완성으로 판단해야 한다", () => {
        const board = createValidSudokuBoard();
        board[0][0] = createMockSudokuCell(null);

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });

      it("충돌이 있으면 미완성으로 판단해야 한다", () => {
        const board = createValidSudokuBoard();
        board[0][0] = createMockSudokuCell(5, true, true); // 충돌 있음

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });

      it("빈 보드는 미완성으로 판단해야 한다", () => {
        const board = createEmptyBoard();

        const isComplete = isBoardComplete(board);
        expect(isComplete).toBe(false);
      });
    });

    describe("isBoardCorrect", () => {
      it("보드가 솔루션과 일치하면 true를 반환해야 한다", () => {
        const solution = createValidSudokuGrid();
        const board = createValidSudokuBoard();

        const isCorrect = isBoardCorrect(board, solution);
        expect(isCorrect).toBe(true);
      });

      it("보드가 솔루션과 다르면 false를 반환해야 한다", () => {
        const solution = createValidSudokuGrid();
        const board = createValidSudokuBoard();
        board[0][0] = createMockSudokuCell(9); // 다른 값으로 변경

        const isCorrect = isBoardCorrect(board, solution);
        expect(isCorrect).toBe(false);
      });

      it("부분적으로 채워진 보드도 올바르게 검사해야 한다", () => {
        const solution = createValidSudokuGrid();
        const board = createEmptyBoard();

        // 일부만 올바르게 채우기
        for (let i = 0; i < 5; i++) {
          board[0][i] = createMockSudokuCell(solution[0][i]);
        }

        const isCorrect = isBoardCorrect(board, solution);
        expect(isCorrect).toBe(false); // 전체가 완성되지 않았으므로
      });
    });
  });

  describe("그리드 검증", () => {
    describe("validateBaseGrid", () => {
      it("유효한 스도쿠 그리드를 검증해야 한다", () => {
        const grid = createValidSudokuGrid();

        const isValid = validateBaseGrid(grid);
        expect(isValid).toBe(true);
      });

      it("잘못된 행이 있는 그리드를 거부해야 한다", () => {
        const grid = createValidSudokuGrid();
        grid[0][1] = grid[0][0]; // 첫 번째 행에 중복 생성

        expect(() => validateBaseGrid(grid)).toThrow();
      });

      it("잘못된 열이 있는 그리드를 거부해야 한다", () => {
        const grid = createValidSudokuGrid();
        grid[1][0] = grid[0][0]; // 첫 번째 열에 중복 생성

        expect(() => validateBaseGrid(grid)).toThrow();
      });

      it("잘못된 블록이 있는 그리드를 거부해야 한다", () => {
        const grid = createValidSudokuGrid();
        grid[1][1] = grid[0][0]; // 첫 번째 블록에 중복 생성

        expect(() => validateBaseGrid(grid)).toThrow();
      });
    });

    describe("isValidPlacement", () => {
      it("유효한 위치에 숫자를 배치할 수 있어야 한다", () => {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

        const isValid = isValidPlacement(grid, 0, 0, 5);
        expect(isValid).toBe(true);
      });

      it("같은 행에 이미 있는 숫자는 배치할 수 없어야 한다", () => {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        grid[0][5] = 5; // 같은 행에 5가 이미 있음

        const isValid = isValidPlacement(grid, 0, 0, 5);
        expect(isValid).toBe(false);
      });

      it("같은 열에 이미 있는 숫자는 배치할 수 없어야 한다", () => {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        grid[5][0] = 5; // 같은 열에 5가 이미 있음

        const isValid = isValidPlacement(grid, 0, 0, 5);
        expect(isValid).toBe(false);
      });

      it("같은 블록에 이미 있는 숫자는 배치할 수 없어야 한다", () => {
        const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
        grid[1][1] = 5; // 같은 블록에 5가 이미 있음

        const isValid = isValidPlacement(grid, 0, 0, 5);
        expect(isValid).toBe(false);
      });

      it("모든 블록에서 올바르게 작동해야 한다", () => {
        // 각 블록의 첫 번째 셀에 1을 배치
        for (let blockRow = 0; blockRow < 3; blockRow++) {
          for (let blockCol = 0; blockCol < 3; blockCol++) {
            const grid = Array.from({ length: 9 }, () => Array(9).fill(0)); // 매번 새 그리드 생성
            const row = blockRow * 3;
            const col = blockCol * 3;

            expect(isValidPlacement(grid, row, col, 1)).toBe(true);
            grid[row][col] = 1;

            // 같은 블록의 다른 위치에는 1을 배치할 수 없어야 함
            expect(isValidPlacement(grid, row + 1, col + 1, 1)).toBe(false);
          }
        }
      });
    });
  });

  describe("킬러 스도쿠 검증", () => {
    describe("validateCages", () => {
      it("유효한 케이지들을 검증해야 한다", () => {
        const solution = createValidSudokuGrid();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            solution[0][0] + solution[0][1],
          ),
          createMockKillerCage(
            2,
            [
              [1, 0],
              [1, 1],
              [1, 2],
            ],
            solution[1][0] + solution[1][1] + solution[1][2],
          ),
        ];

        const isValid = validateCages(cages, solution);
        expect(isValid).toBe(true);
      });

      it("잘못된 합계를 가진 케이지를 거부해야 한다", () => {
        const solution = createValidSudokuGrid();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            999,
          ), // 잘못된 합계
        ];

        const isValid = validateCages(cages, solution);
        expect(isValid).toBe(false);
      });

      it("케이지 내 중복 값을 거부해야 한다", () => {
        const solution = createValidSudokuGrid();
        // 첫 번째 행의 처음 두 셀이 같은 값을 가지도록 조작
        solution[0][1] = solution[0][0];

        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            solution[0][0] + solution[0][1],
          ),
        ];

        const isValid = validateCages(cages, solution);
        expect(isValid).toBe(false);
      });
    });

    describe("validateAllCages", () => {
      it("모든 셀이 케이지에 속해야 한다", () => {
        const solution = createValidSudokuGrid();
        const cages: KillerCage[] = [];

        // 모든 셀을 케이지에 할당
        let cageId = 1;
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            cages.push(createMockKillerCage(cageId++, [[row, col]], solution[row][col]));
          }
        }

        const isValid = validateAllCages(cages, solution);
        expect(isValid).toBe(true);
      });

      it("셀이 누락되면 false를 반환해야 한다", () => {
        const solution = createValidSudokuGrid();
        const cages: KillerCage[] = [
          createMockKillerCage(1, [[0, 0]], solution[0][0]),
          // 나머지 80개 셀이 누락됨
        ];

        const isValid = validateAllCages(cages, solution);
        expect(isValid).toBe(false);
      });

      it("중복된 셀이 있으면 false를 반환해야 한다", () => {
        const solution = createValidSudokuGrid();
        const cages: KillerCage[] = [
          createMockKillerCage(1, [[0, 0]], solution[0][0]),
          createMockKillerCage(2, [[0, 0]], solution[0][0]), // 중복 셀
        ];

        const isValid = validateAllCages(cages, solution);
        expect(isValid).toBe(false);
      });
    });

    describe("isKillerRemovalValid & isKillerRemovalValidLenient", () => {
      it("유효한 제거를 허용해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            8,
          ), // 5 + 3 = 8
        ];

        // [0, 1] 셀을 제거
        board[0][1] = createMockSudokuCell(null);

        const isValidStrict = isKillerRemovalValid(board, cages, [0, 1]);
        const isValidLenient = isKillerRemovalValidLenient(board, cages, [0, 1]);

        expect(isValidStrict).toBe(true);
        expect(isValidLenient).toBe(true);
      });

      it("합계를 초과하는 제거를 거부해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            4,
          ), // 실제 합계(5+3=8)보다 훨씬 작게 설정
        ];

        board[0][1] = createMockSudokuCell(null); // [0,1] 제거, [0,0]만 남음 (값=5)

        const isValidStrict = isKillerRemovalValid(board, cages, [0, 1]);
        const isValidLenient = isKillerRemovalValidLenient(board, cages, [0, 1]);

        // 남은 셀(5)이 케이지 합계(4)를 초과하므로 거부되어야 함
        expect(isValidStrict).toBe(false);
        expect(isValidLenient).toBe(false);
      });

      it("Expert 모드에서는 빈 케이지를 허용해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [createMockKillerCage(1, [[0, 0]], 5)];

        // 케이지의 모든 셀을 제거
        board[0][0] = createMockSudokuCell(null);

        const isValidStrict = isKillerRemovalValid(board, cages, [0, 0]);
        const isValidLenient = isKillerRemovalValidLenient(board, cages, [0, 0]);

        expect(isValidStrict).toBe(false); // 일반 모드는 빈 케이지 거부
        expect(isValidLenient).toBe(true); // Expert 모드는 빈 케이지 허용
      });
    });

    describe("validateKillerCages", () => {
      it("킬러 스도쿠 보드의 케이지 규칙을 검증해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            8,
          ), // 5 + 3 = 8
          createMockKillerCage(
            2,
            [
              [1, 0],
              [1, 1],
            ],
            13,
          ), // 6 + 7 = 13
        ];

        const result = validateKillerCages(board, cages);

        // 기본 충돌 검사도 수행되어야 함
        expect(result[0][0].isConflict).toBe(false);
        expect(result[0][1].isConflict).toBe(false);
      });

      it("케이지 합계 오류를 감지해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            10,
          ), // 실제는 8이지만 10으로 설정
        ];

        const result = validateKillerCages(board, cages);

        expect(result[0][0].isConflict).toBe(true);
        expect(result[0][1].isConflict).toBe(true);
      });
    });

    describe("isKillerBoardComplete", () => {
      it("올바르게 완성된 킬러 보드를 인식해야 한다", () => {
        const board = createValidSudokuBoard();
        const cages: KillerCage[] = [
          createMockKillerCage(
            1,
            [
              [0, 0],
              [0, 1],
            ],
            8,
          ), // 5 + 3 = 8
          createMockKillerCage(
            2,
            [
              [1, 0],
              [1, 1],
            ],
            13,
          ), // 6 + 7 = 13
        ];

        // 나머지 모든 셀을 개별 케이지로 만들기
        let cageId = 3;
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (!((row === 0 && (col === 0 || col === 1)) || (row === 1 && (col === 0 || col === 1)))) {
              const value = board[row][col].value!;
              cages.push(createMockKillerCage(cageId++, [[row, col]], value));
            }
          }
        }

        const isComplete = isKillerBoardComplete(board, cages);
        expect(isComplete).toBe(true);
      });

      it("빈 셀이 있는 킬러 보드를 미완성으로 판단해야 한다", () => {
        const board = createValidSudokuBoard();
        board[0][0] = createMockSudokuCell(null); // 빈 셀 생성

        const cages: KillerCage[] = [createMockKillerCage(1, [[0, 0]], 5)];

        const isComplete = isKillerBoardComplete(board, cages);
        expect(isComplete).toBe(false);
      });
    });
  });

  describe("hasUniqueSolution", () => {
    it("완성된 스도쿠는 유일한 솔루션을 가져야 한다", () => {
      const grid = createValidSudokuGrid().map((row) => row.map((val) => val as number | null));

      const hasUnique = hasUniqueSolution(grid);
      expect(hasUnique).toBe(true);
    });

    it("빈 그리드는 여러 솔루션을 가져야 한다", () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(null));

      const hasUnique = hasUniqueSolution(grid);
      expect(hasUnique).toBe(false);
    });

    it("부분적으로 채워진 유효한 그리드를 처리해야 한다", () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(null));

      // 첫 번째 행만 부분적으로 채우기
      grid[0][0] = 1;
      grid[0][1] = 2;
      grid[0][2] = 3;

      // 이 경우 여러 솔루션이 가능해야 함
      const hasUnique = hasUniqueSolution(grid);
      expect(hasUnique).toBe(false);
    });
  });

  describe("통합 테스트", () => {
    it("전체 검증 파이프라인이 올바르게 작동해야 한다", () => {
      const solution = createValidSudokuGrid();
      const board = createValidSudokuBoard();

      // 1. 기본 그리드 검증
      expect(validateBaseGrid(solution)).toBe(true);

      // 2. 보드 완성도 검사
      expect(isBoardComplete(board)).toBe(true);

      // 3. 보드 정확성 검사
      expect(isBoardCorrect(board, solution)).toBe(true);

      // 4. 충돌 검사
      const checkedBoard = checkConflicts(board);
      const hasAnyConflict = checkedBoard.some((row) => row.some((cell) => cell.isConflict));
      expect(hasAnyConflict).toBe(false);
    });

    it("잘못된 보드는 모든 검증 단계에서 감지되어야 한다", () => {
      const board = createValidSudokuBoard();

      // 의도적으로 오류 생성
      board[0][0] = createMockSudokuCell(board[0][1].value); // 중복 생성

      // 충돌 검사에서 감지되어야 함
      const checkedBoard = checkConflicts(board);
      expect(checkedBoard[0][0].isConflict).toBe(true);
      expect(checkedBoard[0][1].isConflict).toBe(true);

      // 보드 완성도 검사에서 실패해야 함
      expect(isBoardComplete(checkedBoard)).toBe(false);
    });
  });

  describe("에지 케이스", () => {
    it("경계값들을 올바르게 처리해야 한다", () => {
      const board = createEmptyBoard();

      // 모든 경계 위치에서 테스트
      const positions = [
        [0, 0],
        [0, 8],
        [8, 0],
        [8, 8], // 모서리
        [0, 4],
        [8, 4],
        [4, 0],
        [4, 8], // 가장자리 중앙
        [4, 4], // 정 중앙
      ];

      positions.forEach(([row, col]) => {
        expect(() => checkRowConflict(board, row, col, 5)).not.toThrow();
        expect(() => checkColConflict(board, row, col, 5)).not.toThrow();
        expect(() => checkBlockConflict(board, row, col, 5)).not.toThrow();
      });
    });

    it("모든 숫자 범위를 올바르게 처리해야 한다", () => {
      const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

      for (let num = 1; num <= 9; num++) {
        expect(isValidPlacement(grid, 0, 0, num)).toBe(true);
        grid[0][0] = num;
        expect(isValidPlacement(grid, 0, 1, num)).toBe(false); // 같은 행
        grid[0][0] = 0; // 복원
      }
    });
  });
});
