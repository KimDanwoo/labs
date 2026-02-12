import { CageInfo } from "@entities/board/model/types";
import { GAME_MODE } from "@entities/game/model/constants";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useMemo, useState } from "react";
import { useTableDimensions, CellPosition } from "./useTableDimensions";
import { useCagePathCalculator } from "./useCagePathCalculator";

const DEFAULT_CELL_SIZE = 40;

/**
 * 킬러 케이지 위치 계산 훅
 * @returns 킬러 케이지 정보
 */
export const useKillerCage = () => {
  const { cages, gameMode } = useSudokuStore(
    useShallow((state) => ({
      cages: state.cages,
      gameMode: state.gameMode,
    })),
  );
  const [cellPositions, setCellPositions] = useState<Record<string, CellPosition>>({});

  const handleDimensionsChange = useCallback(
    (dimensions: { tableRect: DOMRect | null; cellPositions: Record<string, CellPosition> }) => {
      if (gameMode !== GAME_MODE.KILLER) {
        setCellPositions({});
        return;
      }
      setCellPositions(dimensions.cellPositions);
    },
    [gameMode],
  );

  const { overlayRef } = useTableDimensions(handleDimensionsChange, [cages, gameMode]);

  const cageInfo: CageInfo = useCagePathCalculator({
    cages: gameMode === GAME_MODE.KILLER ? cages : [],
    cellPositions,
  });

  const hasKillerCage = gameMode === GAME_MODE.KILLER && cageInfo.paths.length > 0;

  const cellSize = useMemo(() => {
    if (!hasKillerCage || cageInfo.paths.length === 0) return DEFAULT_CELL_SIZE;

    try {
      const firstPath = cageInfo.paths[0]?.path || "";
      const match = firstPath.match(/M([\d.]+),([\d.]+)/);

      if (match && cageInfo.paths.length > 1) {
        const secondMatch = cageInfo.paths[1]?.path.match(/M([\d.]+),([\d.]+)/);
        if (secondMatch) {
          const x1 = parseFloat(match[1]);
          const x2 = parseFloat(secondMatch[1]);
          return Math.max(Math.abs(x2 - x1), DEFAULT_CELL_SIZE);
        }
      }
    } catch {
      // Silently handle cell size calculation error
    }

    return DEFAULT_CELL_SIZE;
  }, [hasKillerCage, cageInfo.paths]);

  return {
    overlayRef,
    cageInfo,
    cellSize,
  };
};
