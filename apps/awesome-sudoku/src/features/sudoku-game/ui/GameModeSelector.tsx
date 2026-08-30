import { GAME_MODE } from '@entities/game/model/constants';
import type { GameMode } from '@entities/game/model/types';
import { gameModeAtom, switchGameModeAtom } from '@features/sudoku-game/model/atoms';
import { cn } from '@shared/model/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import React, { memo, useCallback } from 'react';

const STARDOKU_ROUTE = '/stardoku';

const gameModes = [
  { label: '클래식', value: GAME_MODE.CLASSIC },
  { label: '킬러', value: GAME_MODE.KILLER },
];

const tabClass = (isActive: boolean) =>
  cn(
    'px-4 py-1.5 rounded-lg text-sm font-medium',
    'transition-all duration-200 ease-out',
    isActive
      ? 'bg-[rgb(var(--color-surface-primary))] text-[rgb(var(--color-text-primary))] shadow-sm'
      : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]',
  );

export const GameModeSelector: React.FC = memo(() => {
  const gameMode = useAtomValue(gameModeAtom);
  const switchGameMode = useSetAtom(switchGameModeAtom);
  const router = useRouter();
  const isStardoku = usePathname() === STARDOKU_ROUTE;

  const handleSwitchGameMode = useCallback(
    (mode: GameMode) => {
      if (isStardoku) {
        // 별도쿠에서 복귀: 이미 그 모드면 진행 중이던 판 유지
        if (gameMode !== mode) switchGameMode({ mode });
        router.push('/');
        return;
      }
      if (gameMode === mode) return;
      switchGameMode({ mode });
    },
    [switchGameMode, gameMode, isStardoku, router],
  );

  const handleGoStardoku = useCallback(() => {
    if (!isStardoku) router.push(STARDOKU_ROUTE);
  }, [isStardoku, router]);

  return (
    <div className="flex items-center gap-1 p-1 bg-[rgb(var(--color-bg-tertiary))]/80 rounded-xl backdrop-blur-sm">
      {gameModes.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleSwitchGameMode(value)}
          className={tabClass(!isStardoku && gameMode === value)}
        >
          {label}
        </button>
      ))}
      <button onClick={handleGoStardoku} className={tabClass(isStardoku)}>
        별도쿠
      </button>
    </div>
  );
});

GameModeSelector.displayName = 'GameModeSelector';
