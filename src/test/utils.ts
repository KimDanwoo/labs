import { SudokuBoard } from "@entities/board/model/types";
import { SudokuCell } from "@entities/cell/model/types";
import { render, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";

// 빈 셀 생성 헬퍼
export const createEmptyCell = (): SudokuCell => ({
  value: null,
  isInitial: false,
  isSelected: false,
  isConflict: false,
  notes: [],
});

// 값이 있는 셀 생성 헬퍼
export const createCell = (
  value: number | null = null,
  isInitial = false,
  isSelected = false,
  isConflict = false,
  notes: number[] = [],
): SudokuCell => ({
  value,
  isInitial,
  isSelected,
  isConflict,
  notes,
});

// 빈 보드 생성 헬퍼
export const createEmptyBoard = (): SudokuBoard =>
  Array(9)
    .fill(null)
    .map(() =>
      Array(9)
        .fill(null)
        .map(() => createEmptyCell()),
    );

// 테스트용 보드 생성 (완성된 스도쿠)
export const createTestBoard = (): SudokuBoard => {
  const solution = [
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

  return solution.map((row) => row.map((value) => createCell(value, true)));
};

// 부분적으로 채워진 테스트 보드
export const createPartialBoard = (): SudokuBoard => {
  const board = createEmptyBoard();

  // 몇 개의 셀에 초기값 설정
  board[0][0] = createCell(5, true);
  board[0][1] = createCell(3, true);
  board[0][4] = createCell(7, true);
  board[1][0] = createCell(6, true);
  board[1][3] = createCell(1, true);
  board[1][4] = createCell(9, true);
  board[1][5] = createCell(5, true);

  return board;
};

// 커스텀 렌더 함수
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => render(ui, { ...options });

export * from "@testing-library/react";
export { customRender as render };
