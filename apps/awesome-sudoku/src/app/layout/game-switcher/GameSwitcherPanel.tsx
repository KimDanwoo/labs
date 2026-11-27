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
      className="group/panel invisible absolute inset-x-4 top-full z-40 mt-1 max-h-[calc(100svh-5rem)] origin-top -translate-y-2 scale-[0.96] overflow-y-auto overscroll-contain rounded-2xl bg-surface-elevated p-2 opacity-0 shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-border-light transition-[opacity,translate,scale,visibility] duration-160 ease-in data-[state=open]:visible data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 data-[state=open]:duration-220 data-[state=open]:ease-snappy sm:inset-x-auto sm:left-0 sm:w-72 sm:origin-top-left"
    >
      <ul className="flex flex-col gap-0.5">
        {GAME_SHELF.map((game) => (
          <GameSwitcherItem key={game.href} game={game} />
        ))}
      </ul>
    </nav>
  );
}
