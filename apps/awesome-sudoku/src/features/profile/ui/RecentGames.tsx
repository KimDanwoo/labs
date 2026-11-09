'use client';
import { type GameRecord, formatTime, GAME_LEVEL_LABELS, GAME_MODE, getRecordPoint } from '@entities/game';
import { cn } from '@shared/model/utils';
import { memo, useState } from 'react';
import { GameDetailSheet } from './GameDetailSheet';

import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
interface RecentGamesProps {
  games: GameRecord[];
  isLoading: boolean;
  error?: Error | null;
}
export const RecentGames = memo<RecentGamesProps>(({ games, isLoading, error }) => {
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error.message} />;
    if (games.length === 0) return <EmptyState />;

    return (
      <div className={cn('divide-y', 'divide-[rgb(var(--color-divider))]')}>
        {games.map((game) => {
          const diffLabel = GAME_LEVEL_LABELS[game.difficulty as keyof typeof GAME_LEVEL_LABELS] || game.difficulty;
          const isKiller = game.gameMode === GAME_MODE.KILLER;
          const point = getRecordPoint(game);
          const mistakes = game.mistakesCount ?? 0;

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => setSelectedGame(game)}
              className={cn(
                'w-full px-4 py-3',
                'hover:bg-[rgb(var(--color-hover))]',
                'transition-colors',
                'flex items-center gap-4',
                'text-left',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full',
                  'flex-shrink-0',
                  'flex items-center justify-center',
                  'bg-[rgb(var(--color-success-bg))]',
                  'text-[rgb(var(--color-success-text))]',
                )}
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-normal', 'text-[rgb(var(--color-text-primary))]')}>{diffLabel}</span>
                  {isKiller && (
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5',
                        'rounded',
                        'bg-[rgb(var(--color-error-bg))]',
                        'text-[rgb(var(--color-error-text))]',
                      )}
                    >
                      킬러
                    </span>
                  )}
                </div>
                <p className={cn('text-sm', 'text-[rgb(var(--color-text-secondary))]')}>
                  {formatTime(game.completionTime)}
                  {' · '}힌트 {game.hintsUsed}회{mistakes > 0 && ` · 오답 ${mistakes}회`}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={cn('font-bold font-tabular', 'text-[rgb(var(--color-text-primary))]')}>+{point}</p>
                <p className={cn('text-xs', 'text-[rgb(var(--color-text-tertiary))]')}>
                  {game.createdAt?.toDate?.() ? new Date(game.createdAt.toDate()).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          'bg-[rgb(var(--color-surface-primary))]',
          'rounded-2xl shadow-sm',
          'border',
          'border-[rgb(var(--color-border-light))]',
          'overflow-hidden',
        )}
      >
        <div className={cn('px-4 py-3 border-b', 'border-[rgb(var(--color-border-light))]')}>
          <h3 className={cn('font-semibold', 'text-[rgb(var(--color-text-primary))]')}>최근 게임</h3>
        </div>
        {renderContent()}
      </div>

      <GameDetailSheet game={selectedGame} isOpen={selectedGame !== null} onClose={() => setSelectedGame(null)} />
    </>
  );
});

RecentGames.displayName = 'RecentGames';
