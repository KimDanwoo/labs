import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { useEffect, useRef, useState } from "react";

interface CageInfo {
  paths: { id: number; path: string }[];
  sums: { id: number; sum: number; x: number; y: number }[];
}

export const KillerCage: React.FC = () => {
  const cages = useSudokuStore((state) => state.cages);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cageInfo, setCageInfo] = useState<CageInfo>({ paths: [], sums: [] });

  useEffect(() => {
    if (gameMode !== GAME_MODE.KILLER) {
      setCageInfo({ paths: [], sums: [] });
      return;
    }

    // 셀 위치 계산 및 케이지 테두리/합계 위치 설정
    const calcPositions = () => {
      const table = document.querySelector("table.border-collapse");
      if (!table) return;

      const cells = table.querySelectorAll("td");
      if (cells.length !== 81) return; // 9x9 스도쿠

      // 셀 위치 정보 저장
      const cellPositions: Record<string, { x: number; y: number; width: number; height: number }> = {};
      const tableRect = table.getBoundingClientRect();

      cells.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const rect = cell.getBoundingClientRect();

        cellPositions[`${row}-${col}`] = {
          x: rect.left - tableRect.left,
          y: rect.top - tableRect.top,
          width: rect.width,
          height: rect.height,
        };
      });

      // 오버레이 크기 설정
      if (overlayRef.current) {
        overlayRef.current.style.width = `${tableRect.width}px`;
        overlayRef.current.style.height = `${tableRect.height}px`;
      }

      // 케이지별 경로 및 합계 위치 계산
      const paths: { id: number; path: string }[] = [];
      const sums: { id: number; sum: number; x: number; y: number }[] = [];
      const processedCageIds = new Set<number>();

      cages.forEach((cage) => {
        if (processedCageIds.has(cage.id)) return;
        processedCageIds.add(cage.id);

        // 케이지 테두리 생성
        const segments: string[] = [];
        const cageCellKeys = new Set(cage.cells.map(([r, c]) => `${r}-${c}`));

        cage.cells.forEach(([row, col]) => {
          const cell = cellPositions[`${row}-${col}`];
          if (!cell) return;

          const padding = Math.min(cell.width, cell.height) * 0.1;

          // 인접 셀 확인하여 테두리 생성
          const edges = [
            { r: row - 1, c: col, side: "top" as const },
            { r: row + 1, c: col, side: "bottom" as const },
            { r: row, c: col - 1, side: "left" as const },
            { r: row, c: col + 1, side: "right" as const },
          ];

          edges.forEach(({ r, c, side }) => {
            if (!cageCellKeys.has(`${r}-${c}`)) {
              const { x, y, width: w, height: h } = cell;
              if (side === "top") {
                segments.push(`M${x + padding},${y + padding} L${x + w - padding},${y + padding}`);
              } else if (side === "right") {
                segments.push(`M${x + w - padding},${y + padding} L${x + w - padding},${y + h - padding}`);
              } else if (side === "bottom") {
                segments.push(`M${x + padding},${y + h - padding} L${x + w - padding},${y + h - padding}`);
              } else if (side === "left") {
                segments.push(`M${x + padding},${y + padding} L${x + padding},${y + h - padding}`);
              }
            }
          });
        });

        paths.push({
          id: cage.id,
          path: segments.join(" "),
        });

        // 합계 표시 위치 (가장 위쪽, 왼쪽 셀)
        const topLeftCell = cage.cells.reduce(
          (topLeft, [r, c]) => {
            if (r < topLeft[0] || (r === topLeft[0] && c < topLeft[1])) {
              return [r, c];
            }
            return topLeft;
          },
          [9, 9],
        );

        const sumCell = cellPositions[`${topLeftCell[0]}-${topLeftCell[1]}`];
        if (sumCell) {
          sums.push({
            id: cage.id,
            sum: cage.sum,
            x: sumCell.x + 2,
            y: sumCell.y + 2,
          });
        }
      });

      setCageInfo({ paths, sums });
    };

    // 초기 계산 및 여러 번 재시도 (DOM 준비 완료 대기)
    calcPositions();
    const timers = [setTimeout(calcPositions, 100), setTimeout(calcPositions, 300), setTimeout(calcPositions, 500)];

    // DOM 변경 감지
    const observer = new MutationObserver(calcPositions);
    const table = document.querySelector("table.border-collapse");
    if (table) {
      observer.observe(table, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    // 리사이즈 이벤트
    window.addEventListener("resize", calcPositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calcPositions);
      timers.forEach(clearTimeout);
    };
  }, [cages, gameMode]);

  if (gameMode !== GAME_MODE.KILLER || cageInfo.paths.length === 0) {
    return null;
  }

  // 셀 크기 계산
  const cellSize = (() => {
    const firstPath = cageInfo.paths[0]?.path || "";
    const match = firstPath.match(/M([\d.]+),([\d.]+)/);

    if (match && cageInfo.paths.length > 1) {
      const secondMatch = cageInfo.paths[1]?.path.match(/M([\d.]+),([\d.]+)/);
      if (secondMatch) {
        const x1 = parseFloat(match[1]);
        const x2 = parseFloat(secondMatch[1]);
        return Math.max(Math.abs(x2 - x1), 40);
      }
    }
    return 40;
  })();

  return (
    <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none z-10">
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
        {cageInfo.paths.map(({ id, path }) => (
          <path
            key={`cage-${id}`}
            d={path}
            fill="none"
            stroke="#436def"
            strokeWidth={1}
            strokeDasharray="4,4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
        ))}
      </svg>

      {cageInfo.sums.map(({ id, sum, x, y }) => (
        <div
          key={`sum-${id}`}
          className="absolute font-medium text-blue-600 z-20"
          style={{
            top: `${y}px`,
            left: `${x}px`,
            fontSize: `${Math.max(0.5, Math.min(0.65, cellSize / 65))}rem`,
            lineHeight: "1",
            backgroundColor: "white",
          }}
        >
          {sum}
        </div>
      ))}
    </div>
  );
};
