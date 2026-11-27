import { cn } from '@shared/lib/cn';
import { GOMOKU_COPY, STONE_OPTIONS } from '@views/gomoku/config/copy';
import { STONE_DOT_CLASS } from '@views/gomoku/config/stone';
import { useGomokuContext } from '@views/gomoku/model/hooks/useGomokuContext';

export function GomokuColorSelect() {
  const { playerStone, selectStone } = useGomokuContext();

  return (
    <div>
      <div role="group" aria-label={GOMOKU_COPY.colorSelect} className="grid grid-cols-2 rounded-[14px] bg-face p-1">
        {STONE_OPTIONS.map(({ stone, label }) => (
          <button
            key={stone}
            type="button"
            aria-pressed={playerStone === stone}
            onClick={() => selectStone(stone)}
            className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[11px] text-[15px] font-semibold text-text-tertiary transition-colors duration-150 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:bg-surface-primary aria-pressed:font-bold aria-pressed:text-text-primary dark:aria-pressed:bg-border-medium"
          >
            <span aria-hidden="true" className={cn('size-3.5 rounded-full', STONE_DOT_CLASS[stone])} />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[13px] text-text-tertiary lg:text-left short-landscape:hidden">
        {GOMOKU_COPY.colorHint}
      </p>
    </div>
  );
}
