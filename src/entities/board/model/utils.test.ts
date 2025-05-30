import { describe, expect, it } from "vitest";
import { Grid } from "./types";
import { deepCopyGrid, getBlockCoordinates, getCenterDistance, isCenter, isCorner, isEdge } from "./utils";

describe("스도쿠 유틸리티 함수 테스트", () => {
  const sampleGrid: Grid = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 4, 5, 6, 7, 8, 9, 1],
    [5, 6, 7, 8, 9, 1, 2, 3, 4],
    [8, 9, 1, 2, 3, 4, 5, 6, 7],
    [3, 4, 5, 6, 7, 8, 9, 1, 2],
    [6, 7, 8, 9, 1, 2, 3, 4, 5],
    [9, 1, 2, 3, 4, 5, 6, 7, 8],
  ];

  describe("deepCopyGrid", () => {
    it("그리드를 깊은 복사해야 함", () => {
      const copied = deepCopyGrid(sampleGrid);

      // 복사된 그리드가 원본과 같은 값을 가져야 함
      expect(copied).toEqual(sampleGrid);

      // 하지만 다른 참조를 가져야 함
      expect(copied).not.toBe(sampleGrid);
      expect(copied[0]).not.toBe(sampleGrid[0]);
    });

    it("원본 그리드를 수정해도 복사된 그리드에 영향을 주지 않아야 함", () => {
      const copied = deepCopyGrid(sampleGrid);
      const originalValue = sampleGrid[0][0];

      // 원본 수정
      sampleGrid[0][0] = 999;

      // 복사본은 변경되지 않아야 함
      expect(copied[0][0]).toBe(originalValue);

      // 원본 복원
      sampleGrid[0][0] = originalValue;
    });

    it("빈 그리드도 복사할 수 있어야 함", () => {
      const emptyGrid: Grid = Array(9)
        .fill(null)
        .map(() => Array(9).fill(0));
      const copied = deepCopyGrid(emptyGrid);

      expect(copied).toEqual(emptyGrid);
      expect(copied).not.toBe(emptyGrid);
    });
  });

  describe("getBlockCoordinates", () => {
    it("첫 번째 블록(0,0)의 좌표를 올바르게 반환해야 함", () => {
      expect(getBlockCoordinates(0, 0)).toEqual([0, 0]);
      expect(getBlockCoordinates(1, 1)).toEqual([0, 0]);
      expect(getBlockCoordinates(2, 2)).toEqual([0, 0]);
    });

    it("두 번째 블록(0,3)의 좌표를 올바르게 반환해야 함", () => {
      expect(getBlockCoordinates(0, 3)).toEqual([0, 3]);
      expect(getBlockCoordinates(1, 4)).toEqual([0, 3]);
      expect(getBlockCoordinates(2, 5)).toEqual([0, 3]);
    });

    it("세 번째 블록(0,6)의 좌표를 올바르게 반환해야 함", () => {
      expect(getBlockCoordinates(0, 6)).toEqual([0, 6]);
      expect(getBlockCoordinates(1, 7)).toEqual([0, 6]);
      expect(getBlockCoordinates(2, 8)).toEqual([0, 6]);
    });

    it("중앙 블록(3,3)의 좌표를 올바르게 반환해야 함", () => {
      expect(getBlockCoordinates(3, 3)).toEqual([3, 3]);
      expect(getBlockCoordinates(4, 4)).toEqual([3, 3]);
      expect(getBlockCoordinates(5, 5)).toEqual([3, 3]);
    });

    it("마지막 블록(6,6)의 좌표를 올바르게 반환해야 함", () => {
      expect(getBlockCoordinates(6, 6)).toEqual([6, 6]);
      expect(getBlockCoordinates(7, 7)).toEqual([6, 6]);
      expect(getBlockCoordinates(8, 8)).toEqual([6, 6]);
    });

    it("모든 9개 블록의 시작 좌표를 올바르게 반환해야 함", () => {
      const expectedBlocks = [
        [0, 0],
        [0, 3],
        [0, 6],
        [3, 0],
        [3, 3],
        [3, 6],
        [6, 0],
        [6, 3],
        [6, 6],
      ];

      const testCases = [
        [0, 0],
        [0, 3],
        [0, 6],
        [3, 0],
        [3, 3],
        [3, 6],
        [6, 0],
        [6, 3],
        [6, 6],
      ];

      testCases.forEach((testCase, index) => {
        expect(getBlockCoordinates(testCase[0], testCase[1])).toEqual(expectedBlocks[index]);
      });
    });
  });

  describe("getCenterDistance", () => {
    it("중앙(4,4)의 거리는 0이어야 함", () => {
      expect(getCenterDistance(4, 4)).toBe(0);
    });

    it("중앙 주변 셀들의 거리를 올바르게 계산해야 함", () => {
      expect(getCenterDistance(3, 4)).toBe(1); // 위
      expect(getCenterDistance(5, 4)).toBe(1); // 아래
      expect(getCenterDistance(4, 3)).toBe(1); // 왼쪽
      expect(getCenterDistance(4, 5)).toBe(1); // 오른쪽
    });

    it("코너들의 거리를 올바르게 계산해야 함", () => {
      expect(getCenterDistance(0, 0)).toBe(8); // 좌상단
      expect(getCenterDistance(0, 8)).toBe(8); // 우상단
      expect(getCenterDistance(8, 0)).toBe(8); // 좌하단
      expect(getCenterDistance(8, 8)).toBe(8); // 우하단
    });

    it("대각선 거리를 올바르게 계산해야 함", () => {
      expect(getCenterDistance(3, 3)).toBe(2);
      expect(getCenterDistance(5, 5)).toBe(2);
      expect(getCenterDistance(2, 2)).toBe(4);
      expect(getCenterDistance(6, 6)).toBe(4);
    });
  });

  describe("isCorner", () => {
    it("네 모서리를 올바르게 식별해야 함", () => {
      expect(isCorner(0, 0)).toBe(true); // 좌상단
      expect(isCorner(0, 8)).toBe(true); // 우상단
      expect(isCorner(8, 0)).toBe(true); // 좌하단
      expect(isCorner(8, 8)).toBe(true); // 우하단
    });

    it("모서리가 아닌 곳은 false를 반환해야 함", () => {
      expect(isCorner(0, 1)).toBe(false); // 상단 가장자리
      expect(isCorner(1, 0)).toBe(false); // 왼쪽 가장자리
      expect(isCorner(4, 4)).toBe(false); // 중앙
      expect(isCorner(3, 5)).toBe(false); // 일반 셀
    });

    it("가장자리이지만 모서리가 아닌 곳은 false를 반환해야 함", () => {
      expect(isCorner(0, 4)).toBe(false); // 상단 중앙
      expect(isCorner(4, 0)).toBe(false); // 왼쪽 중앙
      expect(isCorner(8, 4)).toBe(false); // 하단 중앙
      expect(isCorner(4, 8)).toBe(false); // 오른쪽 중앙
    });
  });

  describe("isEdge", () => {
    it("상단 가장자리를 올바르게 식별해야 함", () => {
      for (let col = 0; col < 9; col++) {
        expect(isEdge(0, col)).toBe(true);
      }
    });

    it("하단 가장자리를 올바르게 식별해야 함", () => {
      for (let col = 0; col < 9; col++) {
        expect(isEdge(8, col)).toBe(true);
      }
    });

    it("왼쪽 가장자리를 올바르게 식별해야 함", () => {
      for (let row = 0; row < 9; row++) {
        expect(isEdge(row, 0)).toBe(true);
      }
    });

    it("오른쪽 가장자리를 올바르게 식별해야 함", () => {
      for (let row = 0; row < 9; row++) {
        expect(isEdge(row, 8)).toBe(true);
      }
    });

    it("내부 셀들은 false를 반환해야 함", () => {
      for (let row = 1; row < 8; row++) {
        for (let col = 1; col < 8; col++) {
          expect(isEdge(row, col)).toBe(false);
        }
      }
    });

    it("모서리도 가장자리여야 함", () => {
      expect(isEdge(0, 0)).toBe(true);
      expect(isEdge(0, 8)).toBe(true);
      expect(isEdge(8, 0)).toBe(true);
      expect(isEdge(8, 8)).toBe(true);
    });
  });

  describe("isCenter", () => {
    it("정확한 중앙(4,4)은 true를 반환해야 함", () => {
      expect(isCenter(4, 4)).toBe(true);
    });

    it("중앙 거리 2 이하인 셀들은 true를 반환해야 함", () => {
      // 거리 1인 셀들
      expect(isCenter(3, 4)).toBe(true);
      expect(isCenter(5, 4)).toBe(true);
      expect(isCenter(4, 3)).toBe(true);
      expect(isCenter(4, 5)).toBe(true);

      // 거리 2인 셀들
      expect(isCenter(2, 4)).toBe(true);
      expect(isCenter(6, 4)).toBe(true);
      expect(isCenter(4, 2)).toBe(true);
      expect(isCenter(4, 6)).toBe(true);
      expect(isCenter(3, 3)).toBe(true);
      expect(isCenter(5, 5)).toBe(true);
    });

    it("중앙 거리 3 이상인 셀들은 false를 반환해야 함", () => {
      // 거리 3인 셀들
      expect(isCenter(1, 4)).toBe(false);
      expect(isCenter(7, 4)).toBe(false);
      expect(isCenter(4, 1)).toBe(false);
      expect(isCenter(4, 7)).toBe(false);

      // 모서리들 (거리 8)
      expect(isCenter(0, 0)).toBe(false);
      expect(isCenter(0, 8)).toBe(false);
      expect(isCenter(8, 0)).toBe(false);
      expect(isCenter(8, 8)).toBe(false);
    });

    it("중앙 영역의 경계를 정확히 판단해야 함", () => {
      // 거리 2 (중앙 영역 경계) - 실제 거리 2인 점들
      expect(isCenter(2, 4)).toBe(true); // 거리 2
      expect(isCenter(6, 4)).toBe(true); // 거리 2
      expect(isCenter(4, 2)).toBe(true); // 거리 2
      expect(isCenter(4, 6)).toBe(true); // 거리 2
      expect(isCenter(3, 3)).toBe(true); // 거리 2
      expect(isCenter(5, 5)).toBe(true); // 거리 2

      // 거리 3 (중앙 영역 밖)
      expect(isCenter(1, 4)).toBe(false); // 거리 3
      expect(isCenter(7, 4)).toBe(false); // 거리 3
      expect(isCenter(4, 1)).toBe(false); // 거리 3
      expect(isCenter(4, 7)).toBe(false); // 거리 3
      expect(isCenter(2, 3)).toBe(false); // 거리 3
      expect(isCenter(3, 2)).toBe(false); // 거리 3

      // 거리 4 (확실히 중앙 영역 밖)
      expect(isCenter(2, 2)).toBe(false); // 거리 4
      expect(isCenter(2, 6)).toBe(false); // 거리 4
      expect(isCenter(6, 2)).toBe(false); // 거리 4
      expect(isCenter(6, 6)).toBe(false); // 거리 4
    });
  });

  // 통합 테스트
  describe("함수들 간의 일관성 테스트", () => {
    it("모든 모서리는 가장자리여야 함", () => {
      const corners = [
        [0, 0],
        [0, 8],
        [8, 0],
        [8, 8],
      ];
      corners.forEach(([row, col]) => {
        expect(isCorner(row, col)).toBe(true);
        expect(isEdge(row, col)).toBe(true);
      });
    });

    it("중앙 셀은 가장자리나 모서리가 아니어야 함", () => {
      expect(isCenter(4, 4)).toBe(true);
      expect(isEdge(4, 4)).toBe(false);
      expect(isCorner(4, 4)).toBe(false);
    });

    it("모든 좌표에 대해 블록 좌표가 유효해야 함", () => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const [blockRow, blockCol] = getBlockCoordinates(row, col);

          // 블록 좌표는 0, 3, 6 중 하나여야 함
          expect([0, 3, 6]).toContain(blockRow);
          expect([0, 3, 6]).toContain(blockCol);
        }
      }
    });
  });
});
