'use client';

import type { ReactNode } from 'react';

import { useGameSwitcherContext } from '@app/model/hooks/useGameSwitcherContext';

interface GameSwitcherMenuProps {
  children: ReactNode;
}

export function GameSwitcherMenu({ children }: GameSwitcherMenuProps) {
  const { menuRef } = useGameSwitcherContext();

  return (
    <div ref={menuRef} className="flex min-w-0 items-center self-stretch sm:relative">
      {children}
    </div>
  );
}
