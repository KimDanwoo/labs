import { CellHighlight } from "./types";

export function getCellBorderStyles(row: number, col: number) {
  return {
    isRightBlockBorder: (col + 1) % 3 === 0 && col < 8,
    isBottomBlockBorder: (row + 1) % 3 === 0 && row < 8,
  };
}

export function getCellHighlightStyles(highlight: CellHighlight, isConflict: boolean) {
  let bgColor = "bg-white";
  let textColor = "text-slate-700";
  let borderColor = "border-slate-200";

  if (highlight.selected) {
    bgColor = "bg-blue-100";
    borderColor = "outline-1 outline-blue-600";
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

export function buildCellClassName(
  { bgColor, textColor, borderColor }: ReturnType<typeof getCellHighlightStyles>,
  { isRightBlockBorder, isBottomBlockBorder }: ReturnType<typeof getCellBorderStyles>,
  isInitial: boolean,
) {
  const baseClasses = [
    "relative",
    "min-w-10 min-h-10",
    "w-10 h-10",
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
