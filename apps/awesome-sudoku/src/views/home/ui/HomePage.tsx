'use client';

import { ThemeToggle } from '@features/theme';
import { cn } from '@shared/lib/cn';
import dynamic from 'next/dynamic';
import { UserProfileMenu } from './auth/UserProfileMenu';
import { SudokuBoard } from './game-board/SudokuBoard';
import { Controls } from './game-controls/Controls';
import { GameStatus } from './game-header/GameStatus';
import { GameModeSelector } from './sudoku-game/GameModeSelector';
import { SelectNumber } from './sudoku-game/SelectNumber';

const PauseGameOverlay = dynamic(() => import('./game-overlays/PauseGameOverlay'), { ssr: false });
const GeneratingOverlay = dynamic(() => import('./game-overlays/GeneratingOverlay'), { ssr: false });
const GameResultSheet = dynamic(() => import('./game-result/GameResultSheet').then((m) => m.GameResultSheet), {
  ssr: false,
});

export const HomePage = () => (
  <main
    className={cn('min-h-svh min-w-[360px]', 'bg-[rgb(var(--color-surface-secondary))]', 'relative overflow-x-hidden')}
  >
    <div className="fixed inset-0 pointer-events-none">
      <div
        className={cn(
          'absolute top-0 left-1/4 w-96 h-96',
          'bg-blue-200/30 dark:bg-blue-800/10',
          'rounded-full blur-3xl',
        )}
      />
      <div
        className={cn(
          'absolute bottom-1/4 right-1/4 w-80 h-80',
          'bg-indigo-200/20 dark:bg-indigo-800/8',
          'rounded-full blur-3xl',
        )}
      />
      <div
        className={cn(
          'absolute top-1/2 left-1/2 w-64 h-64',
          'bg-purple-200/20 dark:bg-purple-800/8',
          'rounded-full blur-3xl',
        )}
      />
    </div>

    <header className={cn('glass-header')}>
      <div
        className={cn(
          'mx-auto py-3',
          'flex items-center justify-between',
          'w-full max-w-[360px]',
          'lg:max-w-[912px] xl:max-w-[1056px]',
        )}
      >
        <GameModeSelector />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserProfileMenu />
        </div>
      </div>
    </header>

    <div className="relative mx-auto px-4 sm:px-6 py-6 md:py-10">
      <div
        className={cn(
          'flex flex-col items-center',
          'lg:grid lg:grid-cols-[auto_auto]',
          'lg:justify-center lg:items-start lg:gap-12',
        )}
      >
        <div className="flex flex-col items-center">
          <div className="w-full mb-4">
            <GameStatus />
          </div>
          <div className="relative">
            <PauseGameOverlay />
            <GeneratingOverlay />
            <SudokuBoard />
          </div>
        </div>

        <div className="hidden lg:flex flex-col pt-[52px]">
          <div
            className={cn(
              'bg-[rgb(var(--color-glass))]/60',
              'dark:bg-[rgb(var(--color-glass))]/70',
              'backdrop-blur-sm rounded-2xl',
              'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
              'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
              'ring-1',
              'ring-[rgb(var(--color-surface-primary))]/80',
              'dark:ring-white/5',
              'w-[432px] xl:w-[504px]',
              'h-[432px] xl:h-[504px]',
              'p-5',
              'flex flex-col gap-4',
            )}
          >
            <Controls />
            <div className="flex-1">
              <SelectNumber />
            </div>
          </div>
        </div>

        <div className="lg:hidden w-full mt-6 space-y-3 max-w-[360px]">
          <Controls />
          <SelectNumber />
        </div>
      </div>
    </div>

    <GameResultSheet />
  </main>
);
