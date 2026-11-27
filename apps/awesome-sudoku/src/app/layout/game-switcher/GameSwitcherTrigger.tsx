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
      className="group inline-flex min-h-11 min-w-0 cursor-pointer items-center gap-1 rounded-md px-2 font-semibold text-text-primary hover:bg-bg-tertiary focus-visible:outline-2 focus-visible:outline-accent aria-expanded:bg-bg-tertiary"
    >
      <span className="truncate">{currentGame.name}</span>
      <span className="sr-only">{GAME_SWITCHER_TEXT.triggerHint}</span>
      <LuChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-text-tertiary group-aria-expanded:rotate-180 motion-safe:transition-transform motion-safe:duration-150"
      />
    </button>
  );
}
