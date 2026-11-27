'use client';

import Link from 'next/link';

import { useGameSwitcherContext } from '@app/model/hooks/useGameSwitcherContext';
import type { ShelfGame } from '@entities/game-catalog';

interface GameSwitcherItemProps {
  game: ShelfGame;
}

export function GameSwitcherItem({ game }: GameSwitcherItemProps) {
  const { currentGame, handleClose } = useGameSwitcherContext();
  const isCurrent = game.href === currentGame.href;

  return (
    <li>
      <Link
        href={game.href}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={handleClose}
        className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-text-primary hover:bg-bg-tertiary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent aria-[current=page]:bg-accent-light aria-[current=page]:text-accent-text"
      >
        <span className="truncate font-medium">{game.name}</span>
        <span className="shrink-0 text-xs text-text-tertiary">{game.category}</span>
      </Link>
    </li>
  );
}
