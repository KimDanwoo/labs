'use client';

import { LuChevronDown } from 'react-icons/lu';

import { GAME_SWITCHER_TEXT } from '@app/config/gameSwitcher';
import { useGameSwitcherContext } from '@app/model/hooks/useGameSwitcherContext';

export function GameSwitcherTrigger() {
  const { currentGame, isOpen, triggerRef, panelId, handleToggle } = useGameSwitcherContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={handleToggle}
      className="group inline-flex h-9 min-w-0 cursor-pointer items-center gap-1 rounded-[10px] bg-weak pr-2.5 pl-3 text-base font-bold text-text-primary hover:bg-border-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-expanded:bg-border-light"
    >
      <span className="truncate">{currentGame.name}</span>
      <span className="sr-only">{GAME_SWITCHER_TEXT.triggerHint}</span>
      <LuChevronDown
        aria-hidden="true"
        className="size-[18px] shrink-0 text-text-tertiary group-aria-expanded:rotate-180 motion-safe:transition-transform motion-safe:duration-150"
      />
    </button>
  );
}
