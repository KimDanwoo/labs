import { cageLabelCell } from '@views/home/lib/cageLabelCell';
import type { CageInfo, CellPosition } from '@views/home/model/types/board';
import { type KillerCage } from '@views/home/model/types/game';
import { useMemo } from 'react';

const CAGE_PADDING_RATIO = 0.1;
const CAGE_SUM_LABEL_OFFSET = 2;

interface UseCagePathCalculatorProps {
  cages: KillerCage[];
  cellPositions: Record<string, CellPosition>;
}

export const useCagePathCalculator = ({ cages, cellPositions }: UseCagePathCalculatorProps): CageInfo =>
  useMemo(() => {
    if (Object.keys(cellPositions).length === 0) {
      return { paths: [], sums: [] };
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

        const padding = Math.min(cell.width, cell.height) * CAGE_PADDING_RATIO;
        const { x, y, width: w, height: h } = cell;

        const edges = [
          {
            r: row - 1,
            c: col,
            path: `M${x + padding},${y + padding} L${x + w - padding},${y + padding}`,
          },
          {
            r: row + 1,
            c: col,
            path: `M${x + padding},${y + h - padding} L${x + w - padding},${y + h - padding}`,
          },
          {
            r: row,
            c: col - 1,
            path: `M${x + padding},${y + padding} L${x + padding},${y + h - padding}`,
          },
          {
            r: row,
            c: col + 1,
            path: `M${x + w - padding},${y + padding} L${x + w - padding},${y + h - padding}`,
          },
        ];

        edges.forEach(({ r, c, path }) => {
          if (!cageCellKeys.has(`${r}-${c}`)) {
            segments.push(path);
          }
        });
      });

      if (segments.length > 0) {
        paths.push({
          id: cage.id,
          path: segments.join(' '),
        });
      }

      const sumCell = cellPositions[cageLabelCell(cage).join('-')];
      if (sumCell) {
        sums.push({
          id: cage.id,
          sum: cage.sum,
          x: sumCell.x + CAGE_SUM_LABEL_OFFSET,
          y: sumCell.y + CAGE_SUM_LABEL_OFFSET,
        });
      }
    });

    return { paths, sums };
  }, [cages, cellPositions]);
