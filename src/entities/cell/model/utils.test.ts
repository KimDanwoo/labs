import { describe, expect, test } from "vitest"; // 또는 '@jest/globals'
import { CellHighlight } from "./types";
import { buildCellClassName, getCellBorderStyles, getCellHighlightStyles } from "./utils";

describe("getCellBorderStyles", () => {
  test("3x3 블록의 오른쪽 테두리를 올바르게 감지한다", () => {
    // 첫 번째 블록의 오른쪽 경계 (열 2, 5)
    expect(getCellBorderStyles(0, 2)).toEqual({
      isRightBlockBorder: true,
      isBottomBlockBorder: false,
    });

    expect(getCellBorderStyles(0, 5)).toEqual({
      isRightBlockBorder: true,
      isBottomBlockBorder: false,
    });

    // 마지막 열은 오른쪽 테두리가 없어야 함
    expect(getCellBorderStyles(0, 8)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    });
  });

  test("3x3 블록의 아래쪽 테두리를 올바르게 감지한다", () => {
    // 첫 번째 블록의 아래쪽 경계 (행 2, 5)
    expect(getCellBorderStyles(2, 0)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: true,
    });

    expect(getCellBorderStyles(5, 0)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: true,
    });

    // 마지막 행은 아래쪽 테두리가 없어야 함
    expect(getCellBorderStyles(8, 0)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    });
  });

  test("블록 모서리에서 양쪽 테두리를 모두 가진다", () => {
    // 첫 번째 블록의 오른쪽 아래 모서리 (2, 2)
    expect(getCellBorderStyles(2, 2)).toEqual({
      isRightBlockBorder: true,
      isBottomBlockBorder: true,
    });

    // 중앙 블록의 오른쪽 아래 모서리 (5, 5)
    expect(getCellBorderStyles(5, 5)).toEqual({
      isRightBlockBorder: true,
      isBottomBlockBorder: true,
    });
  });

  test("일반 셀은 블록 테두리를 가지지 않는다", () => {
    expect(getCellBorderStyles(0, 0)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    });

    expect(getCellBorderStyles(1, 1)).toEqual({
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    });
  });
});

describe("getCellHighlightStyles", () => {
  test("선택된 셀의 스타일을 반환한다", () => {
    const highlight: CellHighlight = {
      selected: true,
      sameValue: false,
      related: false,
    };

    const result = getCellHighlightStyles(highlight, false);

    expect(result).toEqual({
      bgColor: "bg-blue-100",
      textColor: "text-slate-700",
      borderColor: "outline-1 outline-blue-600",
    });
  });

  test("같은 값을 가진 셀의 스타일을 반환한다", () => {
    const highlight: CellHighlight = {
      selected: false,
      sameValue: true,
      related: false,
    };

    const result = getCellHighlightStyles(highlight, false);

    expect(result).toEqual({
      bgColor: "bg-blue-300",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    });
  });

  test("관련된 셀의 스타일을 반환한다", () => {
    const highlight: CellHighlight = {
      selected: false,
      sameValue: false,
      related: true,
    };

    const result = getCellHighlightStyles(highlight, false);

    expect(result).toEqual({
      bgColor: "bg-blue-50",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    });
  });

  test("기본 셀의 스타일을 반환한다", () => {
    const highlight: CellHighlight = {
      selected: false,
      sameValue: false,
      related: false,
    };

    const result = getCellHighlightStyles(highlight, false);

    expect(result).toEqual({
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    });
  });

  test("충돌이 있는 셀의 텍스트 색상을 빨간색으로 변경한다", () => {
    const highlight: CellHighlight = {
      selected: false,
      sameValue: false,
      related: false,
    };

    const result = getCellHighlightStyles(highlight, true);

    expect(result).toEqual({
      bgColor: "bg-white",
      textColor: "text-red-600",
      borderColor: "border-slate-200",
    });
  });

  test("선택된 셀에서도 충돌 색상이 적용된다", () => {
    const highlight: CellHighlight = {
      selected: true,
      sameValue: false,
      related: false,
    };

    const result = getCellHighlightStyles(highlight, true);

    expect(result).toEqual({
      bgColor: "bg-blue-100",
      textColor: "text-red-600",
      borderColor: "outline-1 outline-blue-600",
    });
  });

  test("우선순위: selected > sameValue > related", () => {
    // selected가 가장 높은 우선순위
    const selectedHighlight: CellHighlight = {
      selected: true,
      sameValue: true,
      related: true,
    };

    const selectedResult = getCellHighlightStyles(selectedHighlight, false);
    expect(selectedResult.bgColor).toBe("bg-blue-100");

    // sameValue가 related보다 높은 우선순위
    const sameValueHighlight: CellHighlight = {
      selected: false,
      sameValue: true,
      related: true,
    };

    const sameValueResult = getCellHighlightStyles(sameValueHighlight, false);
    expect(sameValueResult.bgColor).toBe("bg-blue-300");
  });
});

describe("buildCellClassName", () => {
  test("기본 클래스들을 포함한다", () => {
    const highlightStyles = {
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    };
    const borderStyles = {
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    };

    const result = buildCellClassName(highlightStyles, borderStyles, false);

    expect(result).toContain("relative");
    expect(result).toContain("min-w-10 min-h-10");
    expect(result).toContain("w-10 h-10");
    expect(result).toContain("md:w-12 md:h-12");
    expect(result).toContain("lg:w-14 lg:h-14");
    expect(result).toContain("border border-slate-200");
    expect(result).toContain("text-center align-middle");
    expect(result).toContain("cursor-pointer");
    expect(result).toContain("transition-colors duration-100");
    expect(result).toContain("bg-white");
    expect(result).toContain("text-slate-700");
    expect(result).toContain("border-slate-200");
  });

  test("초기 셀에 굵은 글씨체를 적용한다", () => {
    const highlightStyles = {
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    };
    const borderStyles = {
      isRightBlockBorder: false,
      isBottomBlockBorder: false,
    };

    const initialResult = buildCellClassName(highlightStyles, borderStyles, true);
    const normalResult = buildCellClassName(highlightStyles, borderStyles, false);

    expect(initialResult).toContain("font-bold");
    expect(normalResult).toContain("font-normal");
  });

  test("오른쪽 블록 테두리를 추가한다", () => {
    const highlightStyles = {
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    };
    const borderStyles = {
      isRightBlockBorder: true,
      isBottomBlockBorder: false,
    };

    const result = buildCellClassName(highlightStyles, borderStyles, false);

    expect(result).toContain("border-r-2 border-r-slate-800");
  });

  test("아래쪽 블록 테두리를 추가한다", () => {
    const highlightStyles = {
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    };
    const borderStyles = {
      isRightBlockBorder: false,
      isBottomBlockBorder: true,
    };

    const result = buildCellClassName(highlightStyles, borderStyles, false);

    expect(result).toContain("border-b-2 border-b-slate-800");
  });

  test("양쪽 블록 테두리를 모두 추가한다", () => {
    const highlightStyles = {
      bgColor: "bg-white",
      textColor: "text-slate-700",
      borderColor: "border-slate-200",
    };
    const borderStyles = {
      isRightBlockBorder: true,
      isBottomBlockBorder: true,
    };

    const result = buildCellClassName(highlightStyles, borderStyles, false);

    expect(result).toContain("border-r-2 border-r-slate-800");
    expect(result).toContain("border-b-2 border-b-slate-800");
  });

  test("선택된 셀의 전체 클래스명을 올바르게 생성한다", () => {
    const highlightStyles = {
      bgColor: "bg-blue-100",
      textColor: "text-slate-700",
      borderColor: "outline-1 outline-blue-600",
    };
    const borderStyles = {
      isRightBlockBorder: true,
      isBottomBlockBorder: true,
    };

    const result = buildCellClassName(highlightStyles, borderStyles, true);

    expect(result).toContain("bg-blue-100");
    expect(result).toContain("outline-1 outline-blue-600");
    expect(result).toContain("font-bold");
    expect(result).toContain("border-r-2 border-r-slate-800");
    expect(result).toContain("border-b-2 border-b-slate-800");
  });
});

// 통합 테스트
describe("셀 스타일 유틸리티 통합 테스트", () => {
  test("스도쿠 그리드의 특정 위치에서 전체 스타일링이 올바르게 작동한다", () => {
    // 첫 번째 블록의 오른쪽 아래 모서리 (2, 2), 선택된 초기 셀
    const row = 2;
    const col = 2;
    const highlight: CellHighlight = {
      selected: true,
      sameValue: false,
      related: false,
    };
    const isConflict = false;
    const isInitial = true;

    const borderStyles = getCellBorderStyles(row, col);
    const highlightStyles = getCellHighlightStyles(highlight, isConflict);
    const className = buildCellClassName(highlightStyles, borderStyles, isInitial);

    expect(borderStyles.isRightBlockBorder).toBe(true);
    expect(borderStyles.isBottomBlockBorder).toBe(true);
    expect(highlightStyles.bgColor).toBe("bg-blue-100");
    expect(className).toContain("bg-blue-100");
    expect(className).toContain("font-bold");
    expect(className).toContain("border-r-2 border-r-slate-800");
    expect(className).toContain("border-b-2 border-b-slate-800");
  });
});
