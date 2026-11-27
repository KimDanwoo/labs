import type { KeyboardEvent } from 'react';

import { keyToPosition } from '@shared/lib/rovingIndex';
import { PillTab } from '@shared/ui/pill-tab';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL, LEVEL_OPTIONS, LEVEL_TAB_CLASS } from '@views/slitherlink/config/game';
import { useSlitherlinkContext } from '@views/slitherlink/model/hooks/useSlitherlinkContext';
import type { SlitherlinkLevel } from '@views/slitherlink/model/types/slitherlink';

export function LevelSwitch() {
  const { level, confirm } = useSlitherlinkContext();

  const handleSelect = (target: SlitherlinkLevel) => {
    if (target !== level) confirm.request(target);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const current = tabs.findIndex((tab) => tab === event.target);
    const next = keyToPosition(event.key, current, tabs.length);
    if (next === null) return;
    event.preventDefault();
    tabs[next]?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={SLITHERLINK_COPY.levelGroup}
        onKeyDown={handleKeyDown}
        className="grid grid-cols-3 gap-1 rounded-[14px] bg-face p-1"
      >
        {LEVEL_OPTIONS.map((option) => (
          <PillTab
            key={option}
            isSelected={option === level}
            onClick={() => handleSelect(option)}
            className={LEVEL_TAB_CLASS}
          >
            {LEVEL_LABEL[option]}
          </PillTab>
        ))}
      </div>
      <p className="mt-2 text-center text-[13px] text-text-tertiary lg:text-left short-landscape:hidden">
        {SLITHERLINK_COPY.levelHint}
      </p>
    </div>
  );
}
