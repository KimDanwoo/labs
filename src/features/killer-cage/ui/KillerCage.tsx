"use client";

import { KILLER_MODE, useSudokuStore } from "@entities/sudoku/model";
import React, { useMemo } from "react";

// 케이지 시각적 표현을 위한 컴포넌트
export const KillerCage: React.FC = () => {
  const { cages, gameMode } = useSudokuStore();

  // 킬러 모드가 아니면 렌더링하지 않음
  if (gameMode !== KILLER_MODE) return null;

  // 각 케이지마다 SVG 경로 생성
  const cagePaths = useMemo(() => {
    return cages.map((cage) => {
      // 셀 크기 (테이블 셀 크기에 맞춰 조정 필요)
      const cellSize = 40; // 예시 값, 실제 셀 크기에 맞게 조정

      // 케이지 테두리 생성
      const borderSegments: string[] = [];

      // 각 셀의 경계를 확인하여 테두리 생성
      cage.cells.forEach(([row, col]) => {
        // 상하좌우 4개 방향에 대해 해당 방향의 셀이 같은 케이지에 있는지 확인
        const directions = [
          [row - 1, col, "top"], // 위
          [row + 1, col, "bottom"], // 아래
          [row, col - 1, "left"], // 왼쪽
          [row, col + 1, "right"], // 오른쪽
        ];

        directions.forEach(([r, c, side]) => {
          // 해당 방향의 셀이 케이지에 없으면 테두리 추가
          const isAdjCellInCage = cage.cells.some(([cr, cc]) => cr === r && cc === c);

          if (!isAdjCellInCage) {
            switch (side) {
              case "top":
                borderSegments.push(`M${col * cellSize} ${row * cellSize} L${(col + 1) * cellSize} ${row * cellSize}`);
                break;
              case "bottom":
                borderSegments.push(
                  `M${col * cellSize} ${(row + 1) * cellSize} L${(col + 1) * cellSize} ${(row + 1) * cellSize}`,
                );
                break;
              case "left":
                borderSegments.push(`M${col * cellSize} ${row * cellSize} L${col * cellSize} ${(row + 1) * cellSize}`);
                break;
              case "right":
                borderSegments.push(
                  `M${(col + 1) * cellSize} ${row * cellSize} L${(col + 1) * cellSize} ${(row + 1) * cellSize}`,
                );
                break;
            }
          }
        });
      });

      return {
        id: cage.id,
        path: borderSegments.join(" "),
        sum: cage.sum,
        // 첫 번째 셀 위치 (합계 표시용)
        firstCell: cage.cells[0],
      };
    });
  }, [cages]);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
      <svg className="absolute top-0 left-0 w-full h-full">
        {cagePaths.map(({ id, path }) => (
          <path
            key={`cage-${id}`}
            d={path}
            fill="none"
            stroke="#6366f1" // 인디고 색상
            strokeWidth="2"
            strokeDasharray="4,2"
            className="opacity-70"
          />
        ))}
      </svg>

      {/* 케이지 합계 표시 */}
      {cagePaths.map(({ id, sum, firstCell }) => {
        const [row, col] = firstCell;
        const cellSize = 40; // 예시 값, 실제 셀 크기에 맞게 조정

        return (
          <div
            key={`sum-${id}`}
            className="absolute text-xs text-indigo-700 font-semibold z-10"
            style={{
              top: row * cellSize + 2,
              left: col * cellSize + 2,
            }}
          >
            {sum}
          </div>
        );
      })}
    </div>
  );
};
