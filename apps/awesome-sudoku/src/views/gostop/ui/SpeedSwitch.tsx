import type { KeyboardEvent } from 'react';

import { keyToPosition } from '@shared/lib/rovingIndex';
import { PillTab } from '@shared/ui/pill-tab';
import { SETTINGS_COPY } from '@views/gostop/config/copy';
import { SPEED_OPTIONS } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function SpeedSwitch() {
  const { speed, setSpeed } = useGostopContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const next = keyToPosition(
      event.key,
      tabs.findIndex((tab) => tab === event.target),
      tabs.length,
    );
    if (next === null) return;
    event.preventDefault();
    tabs[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={SETTINGS_COPY.speed}
      onKeyDown={handleKeyDown}
      className="flex gap-1 rounded-full bg-face p-1"
    >
      {SPEED_OPTIONS.map((option) => (
        <PillTab
          key={option.value}
          isSelected={option.value === speed}
          onClick={() => setSpeed(option.value)}
          className="h-9"
        >
          {option.label}
        </PillTab>
      ))}
    </div>
  );
}
