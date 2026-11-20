import { DEFAULT_CELL_SIZE } from '@views/home/config/board';
import { GAME_MODE } from '@views/home/config/game';
import { cellSizeFromPaths } from '@views/home/lib/cageCellSize';
import { cagesAtom, gameModeAtom } from '@views/home/model/store/primitives';
import { useCagePathCalculator } from '@views/home/model/sudoku-game/hooks/useCagePathCalculator';
import { useTableDimensions } from '@views/home/model/sudoku-game/hooks/useTableDimensions';
import type { CageInfo, CellPosition, TableDimensions } from '@views/home/model/types/board';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState, type RefObject } from 'react';

export const useKillerCage = (tableRef: RefObject<HTMLTableElement | null>) => {
  const cages = useAtomValue(cagesAtom);
  const gameMode = useAtomValue(gameModeAtom);
  const [cellPositions, setCellPositions] = useState<Record<string, CellPosition>>({});

  const handleDimensionsChange = useCallback(
    (dimensions: TableDimensions) => {
      if (gameMode !== GAME_MODE.KILLER) {
        setCellPositions({});
        return;
      }
      setCellPositions(dimensions.cellPositions);
    },
    [gameMode],
  );

  const { overlayRef } = useTableDimensions(tableRef, handleDimensionsChange);

  const cageInfo: CageInfo = useCagePathCalculator({
    cages: gameMode === GAME_MODE.KILLER ? cages : [],
    cellPositions,
  });

  const hasKillerCage = gameMode === GAME_MODE.KILLER && cageInfo.paths.length > 0;

  const cellSize = useMemo(
    () => (hasKillerCage ? cellSizeFromPaths(cageInfo.paths) : DEFAULT_CELL_SIZE),
    [hasKillerCage, cageInfo.paths],
  );

  return {
    overlayRef,
    cageInfo,
    cellSize,
  };
};
