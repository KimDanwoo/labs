'use client';

import { GAME_SWITCHER_TEXT } from '@app/config/gameSwitcher';
import { GameSwitcherItem } from '@app/layout/game-switcher/GameSwitcherItem';
import { useGameSwitcherContext } from '@app/model/hooks/useGameSwitcherContext';
import { GAME_SHELF } from '@entities/game-catalog';

export function GameSwitcherPanel() {
  const { isOpen, panelId } = useGameSwitcherContext();

  return (
    <nav
      id={panelId}
      aria-label={GAME_SWITCHER_TEXT.navLabel}
      data-state={isOpen ? 'open' : 'closed'}
      className="invisible absolute inset-x-4 top-full z-40 mt-1 max-h-[calc(100svh-5rem)] -translate-y-1 overflow-y-auto overscroll-contain rounded-2xl bg-surface-elevated p-2 opacity-0 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-border-light motion-safe:transition-[opacity,translate,visibility] motion-safe:duration-150 motion-safe:ease-out data-[state=open]:visible data-[state=open]:translate-y-0 data-[state=open]:opacity-100 sm:inset-x-auto sm:left-0 sm:w-72"
    >
      <ul className="flex flex-col gap-0.5">
        {GAME_SHELF.map((game) => (
          <GameSwitcherItem key={game.href} game={game} />
        ))}
      </ul>
    </nav>
  );
}
