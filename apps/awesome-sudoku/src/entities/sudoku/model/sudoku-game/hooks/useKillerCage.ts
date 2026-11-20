import { DEFAULT_CELL_SIZE } from '@entities/sudoku/config/board';
import { GAME_MODE } from '@entities/sudoku/config/game';
import { cellSizeFromPaths } from '@entities/sudoku/lib/cageCellSize';
import { cagesAtom, gameModeAtom } from '@entities/sudoku/model/store/primitives';
import { useCagePathCalculator } from '@entities/sudoku/model/sudoku-game/hooks/useCagePathCalculator';
import { useTableDimensions } from '@entities/sudoku/model/sudoku-game/hooks/useTableDimensions';
import type { CageInfo, CellPosition, TableDimensions } from '@entities/sudoku/model/types/board';
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
