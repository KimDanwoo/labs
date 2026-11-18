import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback } from 'react';

import { gameModeAtom, switchGameModeAtom, type GameMode } from '@entities/game';
import { cn } from '@shared/lib/cn';

import { GAME_MODE_TABS } from '../../config/gameMode';

export const GameModeSelector = memo(() => {
  const gameMode = useAtomValue(gameModeAtom);
  const switchGameMode = useSetAtom(switchGameModeAtom);

  const handleSwitchGameMode = useCallback(
    (mode: GameMode) => {
      if (gameMode === mode) return;
      switchGameMode({ mode });
    },
    [switchGameMode, gameMode],
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-[rgb(var(--color-bg-tertiary))]/80 rounded-xl backdrop-blur-sm">
      {GAME_MODE_TABS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleSwitchGameMode(value)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-normal transition-all duration-200 ease-out',
            gameMode === value
              ? 'bg-[rgb(var(--color-surface-primary))] text-[rgb(var(--color-text-primary))] shadow-sm'
              : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

GameModeSelector.displayName = 'GameModeSelector';
