import { cn } from '@shared/lib/cn';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL, LEVEL_OPTIONS } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import type { SlitherlinkLevel } from '@views/slitherlink/model/types/slitherlink';

export function LevelSwitch() {
  const { level, confirm } = useSlitherlinkContext();

  const handleSelect = (target: SlitherlinkLevel) => {
    if (target !== level) confirm.request(target);
  };

  return (
    <div
      role="group"
      aria-label={SLITHERLINK_COPY.levelGroup}
      className="inline-flex rounded-xl bg-bg-tertiary/80 p-1 backdrop-blur-sm"
    >
      {LEVEL_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === level}
          onClick={() => handleSelect(option)}
          className={cn(
            'h-9 min-w-13 rounded-lg px-3 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
            option === level
              ? 'bg-surface-primary font-semibold text-text-primary shadow-sm'
              : 'font-normal text-text-secondary hover:text-text-primary active:scale-95',
          )}
        >
          {LEVEL_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
