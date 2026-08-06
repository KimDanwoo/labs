'use client';

import { regionAt } from '@entities/stardoku/model/solver';
import { regionColorClass } from '@entities/stardoku/model/utils';
import { StardokuCell } from '@entities/stardoku/ui';
import { marksAtom, puzzleAtom, tapCellAtom } from '@features/stardoku-game/model/atoms';
import { useBoardGestures, useInitializeStage, useWrongFlash } from '@features/stardoku-game/model/hooks';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export const StardokuBoard = () => {
  const puzzle = useAtomValue(puzzleAtom);
  const marks = useAtomValue(marksAtom);
  const tapCell = useSetAtom(tapCellAtom);
  const wrongFlash = useWrongFlash();
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
        role="grid"
        aria-label={`별도쿠 보드 ${size}×${size}`}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={cn(
          'relative grid aspect-square w-full touch-none select-none overflow-hidden rounded-xl',
          'border-2 border-[rgb(var(--color-text-primary))]/60',
          'bg-[rgb(var(--color-surface-primary))]',
          'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]',
          'dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]',
        )}
      >
        {marks.map((rowMarks, row) =>
          rowMarks.map((mark, col) => {
            const regionId = regionAt(regions, row, col);
            return (
              <StardokuCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                mark={mark}
                colorClass={regionColorClass(regionId, size)}
                hasRegionBorderTop={row > 0 && regionAt(regions, row - 1, col) !== regionId}
                hasRegionBorderLeft={col > 0 && regionAt(regions, row, col - 1) !== regionId}
                isWrong={wrongFlash?.row === row && wrongFlash?.col === col}
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
