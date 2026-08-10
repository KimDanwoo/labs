'use client';

import { CELL_MARK, STAR_POP_STAGGER_MS } from '@entities/stardoku/model/constants';
import { regionAt } from '@entities/stardoku/model/solver';
import { cellKey, regionColorClass, regionColorIndexes } from '@entities/stardoku/model/utils';
import { StardokuCell } from '@entities/stardoku/ui';
import {
  isClearedAtom,
  marksAtom,
  puzzleAtom,
  stageAtom,
  tapCellAtom,
  violatingKeysAtom,
} from '@features/stardoku-game/model/atoms';
import { useBoardGestures, useHapticFeedback, useInitializeStage } from '@features/stardoku-game/model/hooks';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

/**
 * 보드 폭은 가로 여유와 세로 여유 중 작은 쪽을 따른다.
 * 가로만 보면 세로가 짧은 폰에서 보드가 화면을 다 먹어 컨트롤이 스크롤 밖으로 밀린다.
 * 250px = 헤더·상태·안내문·컨트롤·안전영역을 합친 세로 크롬(모바일 기준).
 */
const BOARD_WIDTH_CLAMP = 'max-w-[min(400px,max(180px,calc(100svh-250px)))] lg:max-w-[min(464px,calc(100svh-260px))]';

export const StardokuBoard = () => {
  const puzzle = useAtomValue(puzzleAtom);
  const marks = useAtomValue(marksAtom);
  const stage = useAtomValue(stageAtom);
  const violatingKeys = useAtomValue(violatingKeysAtom);
  const isCleared = useAtomValue(isClearedAtom);
  const tapCell = useSetAtom(tapCellAtom);
  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel } = useBoardGestures();

  useInitializeStage();
  useHapticFeedback();

  const handleKeyboardTap = useCallback(
    (row: number, col: number, time: number) => tapCell({ row, col, time }),
    [tapCell],
  );

  const colorIndexes = useMemo(() => (puzzle ? regionColorIndexes(puzzle.regions) : []), [puzzle]);

  if (!puzzle) {
    return (
      <div
        className={cn(
          'aspect-square w-full',
          BOARD_WIDTH_CLAMP,
          'animate-pulse rounded-xl',
          'bg-[rgb(var(--color-surface-primary))]',
        )}
      />
    );
  }

  const { size, regions } = puzzle;

  return (
    <div className={cn('group relative w-full flex-shrink-0', BOARD_WIDTH_CLAMP)}>
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
                colorClass={regionColorClass(colorIndexes[regionId] ?? 0)}
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
