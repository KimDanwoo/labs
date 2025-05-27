import { CageInfo } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/game-controls/model/stores";
import { useEffect, useMemo, useRef, useState } from "react";

export const useKillerCage = () => {
  const cages = useSudokuStore((state) => state.cages);
  const gameMode = useSudokuStore((state) => state.gameMode);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cageInfo, setCageInfo] = useState<CageInfo>({ paths: [], sums: [] });

  useEffect(() => {
    if (gameMode !== GAME_MODE.KILLER) {
      setCageInfo({ paths: [], sums: [] });
      return;
    }

    const calcPositions = () => {
      const table = document.querySelector("table.border-collapse");
      if (!table) return;

      const cells = table.querySelectorAll("td");
      if (cells.length !== 81) return;

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

      if (overlayRef.current) {
        overlayRef.current.style.width = `${tableRect.width}px`;
        overlayRef.current.style.height = `${tableRect.height}px`;
      }

      const paths: { id: number; path: string }[] = [];
      const sums: { id: number; sum: number; x: number; y: number }[] = [];
      const processedCageIds = new Set<number>();

      cages.forEach((cage) => {
        if (processedCageIds.has(cage.id)) return;
        processedCageIds.add(cage.id);

        const segments: string[] = [];
        const cageCellKeys = new Set(cage.cells.map(([r, c]) => `${r}-${c}`));

        cage.cells.forEach(([row, col]) => {
          const cell = cellPositions[`${row}-${col}`];
          if (!cell) return;

          const padding = Math.min(cell.width, cell.height) * 0.1;

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

    calcPositions();
    const timers = [setTimeout(calcPositions, 100), setTimeout(calcPositions, 300), setTimeout(calcPositions, 500)];

    const observer = new MutationObserver(calcPositions);
    const table = document.querySelector("table.border-collapse");
    if (table) {
      observer.observe(table, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener("resize", calcPositions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calcPositions);
      timers.forEach(clearTimeout);
    };
  }, [cages, gameMode]);

  const hasKillerCage = gameMode === GAME_MODE.KILLER && cageInfo.paths.length > 0;

  const cellSize = useMemo(() => {
    if (!hasKillerCage) return 0;

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
  }, [cageInfo.paths]);

  return {
    overlayRef,
    cageInfo,
    cellSize,
  };
};
