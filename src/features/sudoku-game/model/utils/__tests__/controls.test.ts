import { Grid, SudokuBoard } from "@entities/board/model/types";
import { describe, expect, it } from "vitest";
import { getHint } from "../controls";

describe("getHint", () => {
  // 테스트용 보드와 솔루션 데이터
  const mockBoard: SudokuBoard = [
    [
      { value: 1, isInitial: true, isSelected: false, isConflict: false, notes: [] },
      { value: null, isInitial: false, isSelected: false, isConflict: false, notes: [] },
      { value: 3, isInitial: true, isSelected: false, isConflict: false, notes: [] },
    ],
    [
      { value: null, isInitial: false, isSelected: false, isConflict: false, notes: [] },
      { value: 5, isInitial: true, isSelected: false, isConflict: false, notes: [] },
      { value: null, isInitial: false, isSelected: false, isConflict: false, notes: [] },
    ],
    [
      { value: 7, isInitial: true, isSelected: false, isConflict: false, notes: [] },
      { value: null, isInitial: false, isSelected: false, isConflict: false, notes: [] },
      { value: 9, isInitial: true, isSelected: false, isConflict: false, notes: [] },
    ],
  ];

  const mockSolution: Grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  it("빈 셀이 없는 경우 null을 반환해야 합니다", () => {
    const fullBoard: SudokuBoard = mockBoard.map((row) => row.map((cell) => ({ ...cell, value: 1 })));
    const result = getHint(fullBoard, mockSolution);
    expect(result).toBeNull();
  });

  it("빈 셀이 있는 경우 유효한 힌트를 반환해야 합니다", () => {
    const result = getHint(mockBoard, mockSolution);

    // 반환된 힌트가 유효한 형식인지 확인
    expect(result).toHaveProperty("row");
    expect(result).toHaveProperty("col");
    expect(result).toHaveProperty("value");

    if (result) {
      // 반환된 위치가 실제로 빈 셀인지 확인
      expect(mockBoard[result.row][result.col].value).toBeNull();

      // 반환된 값이 솔루션과 일치하는지 확인
      expect(result.value).toBe(mockSolution[result.row][result.col]);

      // 반환된 위치가 보드 범위 내에 있는지 확인
      expect(result.row).toBeGreaterThanOrEqual(0);
      expect(result.row).toBeLessThan(mockBoard.length);
      expect(result.col).toBeGreaterThanOrEqual(0);
      expect(result.col).toBeLessThan(mockBoard[0].length);
    }
  });

  it("여러 번 실행해도 항상 유효한 힌트를 반환해야 합니다", () => {
    const results = new Set<string>();

    // 여러 번 실행하여 다양한 결과가 나오는지 확인
    for (let i = 0; i < 10; i++) {
      const result = getHint(mockBoard, mockSolution);
      if (result) {
        results.add(`${result.row},${result.col}`);
      }
    }

    // 최소한 하나 이상의 다른 위치가 선택되었는지 확인
    expect(results.size).toBeGreaterThan(0);
  });
});
