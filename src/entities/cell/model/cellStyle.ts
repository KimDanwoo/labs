import { CellHighlight } from "./types";

/**
 * 셀 테두리 스타일을 반환
 * @param row - 행
 * @param col - 열
 * @returns 셀 테두리 스타일
 */
export function getCellBorderStyles(row: number, col: number) {
  return {
    isRightBlockBorder: (col + 1) % 3 === 0 && col < 8,
    isBottomBlockBorder: (row + 1) % 3 === 0 && row < 8,
  };
}

/**
 * 셀 하이라이트 스타일을 반환
 * @param highlight - 셀 하이라이트
 * @param isConflict - 충돌 여부
 * @returns 셀 하이라이트 스타일
 */
export function getCellHighlightStyles(highlight: CellHighlight, isConflict: boolean) {
  let bgColor = "bg-white";
  let textColor = "text-slate-700";
  const borderColor = "border-slate-200";

  if (highlight.selected) {
    bgColor = "bg-blue-200";
  } else if (highlight.sameValue) {
    bgColor = "bg-blue-300";
  } else if (highlight.related) {
    bgColor = "bg-blue-50";
  }

  if (isConflict) {
    textColor = "text-red-600";
  }

  return { bgColor, textColor, borderColor };
}

/**
 * Builds the CSS class string for a Sudoku cell based on highlight, border, and initial state.
 *
 * Combines base sizing, alignment, and transition classes with dynamic styles for background, text, border, font weight, and block borders.
 *
 * @param isInitial - Whether the cell is part of the initial puzzle (renders bold if true).
 * @returns The concatenated CSS class string for the cell.
 */
export function buildCellClassName(
  { bgColor, textColor, borderColor }: ReturnType<typeof getCellHighlightStyles>,
  { isRightBlockBorder, isBottomBlockBorder }: ReturnType<typeof getCellBorderStyles>,
  isInitial: boolean,
) {
  const baseClasses = [
    "relative",
    "min-w-8 min-h-8",
    "w-8 h-8",
    "md:w-12 md:h-12",
    "lg:w-14 lg:h-14",
    "border border-slate-200",
    "text-center align-middle",
    "cursor-pointer",
    "transition-colors duration-100",
    bgColor,
    textColor,
    borderColor,
    isInitial ? "font-bold" : "font-normal",
  ];

  if (isRightBlockBorder) {
    baseClasses.push("border-r-2 border-r-slate-800");
  }
  if (isBottomBlockBorder) {
    baseClasses.push("border-b-2 border-b-slate-800");
  }

  return baseClasses.join(" ");
}
