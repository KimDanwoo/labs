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
    <li className="-translate-y-1 opacity-0 transition-[opacity,translate] duration-120 ease-in group-data-[state=open]/panel:translate-y-0 group-data-[state=open]/panel:opacity-100 group-data-[state=open]/panel:delay-[calc((sibling-index()-1)*24ms)] group-data-[state=open]/panel:duration-220 group-data-[state=open]/panel:ease-snappy">
      <Link
        href={game.href}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={handleClose}
        className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-text-primary transition-colors duration-150 hover:bg-weak focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent aria-[current=page]:bg-lemon-soft aria-[current=page]:text-on-lemon-soft"
      >
        <span className="truncate font-semibold">{game.name}</span>
        <span className="shrink-0 text-xs text-text-tertiary">{game.category}</span>
      </Link>
    </li>
  );
}
