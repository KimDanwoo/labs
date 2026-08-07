'use client';

import { CELL_MARK, STAR_POP_STAGGER_MS } from '@entities/stardoku/model/constants';
import { regionAt } from '@entities/stardoku/model/solver';
import { cellKey, regionColorClass } from '@entities/stardoku/model/utils';
import { StardokuCell } from '@entities/stardoku/ui';
import {
  isClearedAtom,
  marksAtom,
  puzzleAtom,
  stageAtom,
  tapCellAtom,
  violatingKeysAtom,
} from '@features/stardoku-game/model/atoms';
import { useBoardGestures, useInitializeStage } from '@features/stardoku-game/model/hooks';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export const StardokuBoard = () => {
  const puzzle = useAtomValue(puzzleAtom);
  const marks = useAtomValue(marksAtom);
  const stage = useAtomValue(stageAtom);
  const violatingKeys = useAtomValue(violatingKeysAtom);
  const isCleared = useAtomValue(isClearedAtom);
  const tapCell = useSetAtom(tapCellAtom);
  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = useBoardGestures();

  useInitializeStage();

  const handleKeyboardTap = useCallback(
    (row: number, col: number, time: number) => tapCell({ row, col, time }),
    [tapCell],
  );

  if (!puzzle) {
    return (
      <div
        className={cn(
          'aspect-square w-full max-w-[336px] lg:max-w-[432px]',
          'animate-pulse rounded-xl',
          'bg-[rgb(var(--color-surface-primary))]',
        )}
      />
    );
  }

  const { size, regions } = puzzle;

  return (
    <div className="group relative w-full max-w-[336px] flex-shrink-0 lg:max-w-[432px]">
      {/* Outer glow */}
      <div
        className={cn(
          'absolute -inset-3 opacity-60 blur-2xl transition-opacity duration-500',
          'bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-purple-400/20',
          'dark:from-blue-500/10 dark:via-indigo-500/5 dark:to-purple-500/10',
          'group-hover:opacity-80',
        )}
      />

      <div
        key={stage}
        role="grid"
        aria-label={`별도쿠 보드 ${size}×${size}`}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={cn(
          'relative grid aspect-square w-full touch-none select-none overflow-hidden rounded-xl',
          'animate-board-in',
          'border-2 border-[rgb(var(--color-text-primary))]/60',
          'bg-[rgb(var(--color-surface-primary))]',
          'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]',
          'dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]',
        )}
      >
        {marks.map((rowMarks, row) =>
          rowMarks.map((mark, col) => {
            const regionId = regionAt(regions, row, col);
            const isStar = mark === CELL_MARK.STAR;
            return (
              <StardokuCell
                key={cellKey(row, col)}
                row={row}
                col={col}
                mark={mark}
                colorClass={regionColorClass(regionId, size)}
                hasRegionBorderTop={row > 0 && regionAt(regions, row - 1, col) !== regionId}
                hasRegionBorderLeft={col > 0 && regionAt(regions, row, col - 1) !== regionId}
                isViolating={violatingKeys.has(cellKey(row, col))}
                popDelayMs={isCleared && isStar ? row * STAR_POP_STAGGER_MS : null}
                onKeyboardTap={handleKeyboardTap}
              />
            );
          }),
        )}
      </div>
    </div>
  );
};

export default StardokuBoard;
