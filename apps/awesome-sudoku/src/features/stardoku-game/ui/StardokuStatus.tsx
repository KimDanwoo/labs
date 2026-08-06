import { MAX_LIVES, STAR_ICON } from '@entities/stardoku/model/constants';
import { livesAtom, puzzleAtom, scoreAtom, stageAtom, starCountAtom } from '@features/stardoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

export const StardokuStatus = memo(() => {
  const stage = useAtomValue(stageAtom);
  const puzzle = useAtomValue(puzzleAtom);
  const starCount = useAtomValue(starCountAtom);
  const lives = useAtomValue(livesAtom);
  const score = useAtomValue(scoreAtom);
  const heartCount = Math.min(Math.max(lives, 0), MAX_LIVES);

  return (
    <div className="flex w-full items-end justify-between">
      <div>
        <p className={cn('text-[10px] font-semibold tracking-[0.18em]', 'text-[rgb(var(--color-text-secondary))]')}>
          STAGE
        </p>
        <p className={cn('text-2xl font-bold leading-none font-tabular', 'text-[rgb(var(--color-text-primary))]')}>
          {stage}
          {puzzle && (
            <span className={cn('ml-2 text-xs font-semibold', 'text-[rgb(var(--color-text-secondary))]')}>
              {puzzle.size}×{puzzle.size}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span aria-label={`남은 목숨 ${heartCount}개`} className="text-sm tracking-wider">
          {'❤️'.repeat(heartCount)}
          {'🤍'.repeat(MAX_LIVES - heartCount)}
        </span>
        <span className={cn('text-sm font-tabular', 'text-[rgb(var(--color-text-secondary))]')}>
          {STAR_ICON} {starCount} / {puzzle?.size ?? '–'} ·{' '}
          <b className="text-[rgb(var(--color-text-primary))]">{score}점</b>
        </span>
      </div>
    </div>
  );
});

StardokuStatus.displayName = 'StardokuStatus';
