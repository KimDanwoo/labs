import { cn } from "@shared/model/utils";
import { CellHighlight } from "./types";

/**
 * 셀 테두리 스타일을 반환
 */
export function getCellBorderStyles(row: number, col: number) {
  return {
    isRightBlockBorder: (col + 1) % 3 === 0 && col < 8,
    isBottomBlockBorder: (row + 1) % 3 === 0 && row < 8,
  };
}

/**
 * 셀 하이라이트 스타일을 반환 - Jonathan Ive inspired
 */
export function getCellHighlightStyles(highlight: CellHighlight, isConflict: boolean) {
  return {
    bgColor: cn(
      "bg-white",
      highlight.related && "bg-[rgb(245,248,255)]",
      highlight.sameValue && "bg-[rgb(220,235,255)]",
      highlight.selected && "bg-[rgb(200,225,255)]",
    ),
    textColor: cn(
      "text-[rgb(28,28,30)]",
      isConflict && "text-[rgb(255,59,48)] animate-subtle-pulse",
    ),
    borderColor: "border-[rgb(229,229,234)]",
  };
}

/**
 * 셀 클래스 이름을 빌드 - Refined, minimal design
 * Cell sizes: 32px (mobile) -> 40px (sm) -> 48px (lg) -> 56px (xl)
 * Board sizes: 288px -> 360px -> 432px -> 504px
 */
export function buildCellClassName(
  { bgColor, textColor, borderColor }: ReturnType<typeof getCellHighlightStyles>,
  { isRightBlockBorder, isBottomBlockBorder }: ReturnType<typeof getCellBorderStyles>,
  isInitial: boolean,
) {
  return cn(
    "relative",
    // Responsive sizes - fits within 320px min-width
    "w-8 h-8",         // 32px * 9 = 288px
    "sm:w-10 sm:h-10", // 40px * 9 = 360px
    "lg:w-12 lg:h-12", // 48px * 9 = 432px
    "xl:w-14 xl:h-14", // 56px * 9 = 504px
    // Border styling - subtle and refined
    "border",
    borderColor,
    // Text alignment
    "text-center align-middle",
    // Interaction
    "cursor-pointer",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none",
    "select-none",
    "touch-manipulation",
    // Colors
    bgColor,
    textColor,
    // Typography
    isInitial ? "font-semibold" : "font-normal",
    // Block borders - subtle but visible
    isRightBlockBorder && "border-r-[1.5px] border-r-[rgb(199,199,204)]",
    isBottomBlockBorder && "border-b-[1.5px] border-b-[rgb(199,199,204)]",
    // Hover effect
    "hover:bg-[rgb(245,248,255)]",
  );
}
