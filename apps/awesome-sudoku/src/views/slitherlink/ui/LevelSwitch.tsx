import type { KeyboardEvent } from 'react';

import { keyToPosition } from '@shared/lib/rovingIndex';
import { PillTab } from '@shared/ui/pill-tab';
import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { LEVEL_LABEL, LEVEL_OPTIONS } from '@views/slitherlink/config/game';
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
    <div role="tablist" aria-label={SLITHERLINK_COPY.levelGroup} onKeyDown={handleKeyDown} className="flex gap-1.5">
      {LEVEL_OPTIONS.map((option) => (
        <PillTab
          key={option}
          isSelected={option === level}
          onClick={() => handleSelect(option)}
          className="h-11 px-4 text-[15px]"
        >
          {LEVEL_LABEL[option]}
        </PillTab>
      ))}
    </div>
  );
}
