'use client';

import { UserProfileMenu } from '@features/auth/ui';
import { useStageClearFlow, useSyncStardokuScore } from '@features/stardoku-game/model/hooks';
import { StardokuControls, StardokuStatus } from '@features/stardoku-game/ui';
import { GameModeSelector } from '@features/sudoku-game/ui';
import { ThemeToggle } from '@features/theme/ui/ThemeToggle';
import { cn } from '@shared/model/utils';
import { Snackbar } from '@shared/ui';
import { StardokuBoard } from '@widgets/stardoku-board/ui';
import dynamic from 'next/dynamic';

const StardokuResultSheet = dynamic(
  () => import('@features/stardoku-game/ui/StardokuResultSheet').then((m) => m.StardokuResultSheet),
  { ssr: false },
);

export const StardokuPage = () => {
  useSyncStardokuScore();
  const { toast, hideToast } = useStageClearFlow();

  return (
    <main className={cn('min-h-svh', 'bg-[rgb(var(--color-surface-secondary))]', 'relative overflow-x-hidden')}>
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div
          className={cn(
            'absolute top-0 left-1/4 h-96 w-96',
            'bg-amber-200/30 dark:bg-amber-800/10',
            'rounded-full blur-3xl',
          )}
        />
        <div
          className={cn(
            'absolute right-1/4 bottom-1/4 h-80 w-80',
            'bg-indigo-200/20 dark:bg-indigo-800/8',
            'rounded-full blur-3xl',
          )}
        />
      </div>

      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-30 backdrop-blur-xl',
          'bg-[rgb(var(--color-glass))]/[var(--glass-opacity)]',
          'border-b border-[rgb(var(--color-border-light))]/50',
        )}
      >
        <div
          className={cn(
            'mx-auto py-3',
            'flex items-center justify-between',
            'w-full max-w-[400px] px-3 sm:px-0',
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

      {/* Main content — 모바일에서 스크롤 없이 한 화면에 들어가야 한다(컨트롤이 밀리면 조작이 끊긴다) */}
      <div className="relative mx-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 md:py-10">
        <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-3 lg:max-w-[464px] lg:gap-4">
          <StardokuStatus />
          <StardokuBoard />
          <p className={cn('text-center text-xs', 'text-[rgb(var(--color-text-secondary))]')}>
            탭 ✕ · 연속 탭 ⭐ · 드래그로 일괄 ✕/지우기
          </p>
          <StardokuControls />
        </div>
      </div>

      <StardokuResultSheet />
      <Snackbar message={toast ?? ''} isVisible={toast !== null} onClose={hideToast} variant="success" />
    </main>
  );
};
