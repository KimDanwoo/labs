import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState, type RefObject } from 'react';
import { DEFAULT_CELL_SIZE } from '../../../config/board';
import { GAME_MODE } from '../../../config/game';
import { cellSizeFromPaths } from '../../../lib/cageCellSize';
import { cagesAtom, gameModeAtom } from '../../store/primitives';
import type { CageInfo, CellPosition, TableDimensions } from '../../types/board';
import { useCagePathCalculator } from './useCagePathCalculator';
import { useTableDimensions } from './useTableDimensions';

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
