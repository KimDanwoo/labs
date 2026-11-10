'use client';
import { GAME_LEVEL_LABELS, formatScore, formatTime, type DifficultyStats } from '@entities/game';
import { cn } from '@shared/lib/cn';
import { memo } from 'react';

import { DifficultyBadge } from './DifficultyBadge';
interface StatsByDifficultyProps {
  stats: DifficultyStats[];
}
export const StatsByDifficulty = memo<StatsByDifficultyProps>(({ stats }) => (
  <div
    className={cn(
      'bg-[rgb(var(--color-surface-primary))] rounded-2xl',
      'shadow-sm border border-[rgb(var(--color-border-light))]',
      'overflow-hidden',
    )}
  >
    <div className="px-4 py-3 border-b border-[rgb(var(--color-border-light))]">
      <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">난이도별 통계</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <caption className="sr-only">난이도별 통계표</caption>
        <thead>
          <tr
            className={cn(
              'text-left text-xs',
              'text-[rgb(var(--color-text-secondary))]',
              'border-b border-[rgb(var(--color-border-light))]',
            )}
          >
            <th className="px-4 py-3 font-normal">난이도</th>
            <th className="px-4 py-3 font-normal">플레이</th>
            <th className="px-4 py-3 font-normal">완료</th>
            <th className="px-4 py-3 font-normal hidden sm:table-cell">평균 시간</th>
            <th className="px-4 py-3 font-normal hidden sm:table-cell">최고 시간</th>
            <th className="px-4 py-3 font-normal">최고 포인트</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => {
            const label = GAME_LEVEL_LABELS[stat.difficulty as keyof typeof GAME_LEVEL_LABELS];

            return (
              <tr
                key={stat.difficulty}
                className={cn(
                  'border-b border-[rgb(var(--color-divider))]',
                  'last:border-0',
                  'hover:bg-[rgb(var(--color-hover))]',
                  'transition-colors',
                )}
              >
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={stat.difficulty} label={label} />
                </td>
                <td className="px-4 py-3 font-tabular text-[rgb(var(--color-text-primary))]">{stat.gamesPlayed}</td>
                <td className="px-4 py-3 font-tabular text-[rgb(var(--color-text-primary))]">{stat.completedGames}</td>
                <td className="px-4 py-3 font-mono text-[rgb(var(--color-text-secondary))] hidden sm:table-cell">
                  {stat.averageTime > 0 ? formatTime(stat.averageTime) : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-[rgb(var(--color-text-secondary))] hidden sm:table-cell">
                  {stat.bestTime > 0 ? formatTime(stat.bestTime) : '-'}
                </td>
                <td className="px-4 py-3 font-tabular font-semibold text-[rgb(var(--color-text-primary))]">
                  {stat.bestScore > 0 ? formatScore(stat.bestScore) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
));

StatsByDifficulty.displayName = 'StatsByDifficulty';
