import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback } from 'react';

import { cn } from '@shared/lib/cn';
import { requestNewGameAtom } from '../../model/store/gameConfirmAtoms';
import { gameModeAtom } from '../../model/store/primitives';
import { type GameMode } from '../../model/types/game';

import { GAME_MODE_TABS } from '../../config/gameMode';

export const GameModeSelector = memo(() => {
  const gameMode = useAtomValue(gameModeAtom);
  const requestNewGame = useSetAtom(requestNewGameAtom);

  const handleSwitchGameMode = useCallback(
    (mode: GameMode) => {
      if (gameMode === mode) return;
      requestNewGame({ mode });
    },
    [requestNewGame, gameMode],
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-bg-tertiary/80 rounded-xl backdrop-blur-sm">
      {GAME_MODE_TABS.map(({ value, label }) => (
        <button
          key={value}
          aria-pressed={gameMode === value}
          onClick={() => handleSwitchGameMode(value)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-normal transition-all duration-200 ease-out',
            gameMode === value
              ? 'bg-surface-primary text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
});

GameModeSelector.displayName = 'GameModeSelector';
