'use client';
import { formatScore, formatTime } from '@entities/game/model/services';
import type { GameStats } from '@entities/game/model/types';
import { memo } from 'react';

import { CheckIcon } from './CheckIcon';
import { ClockIcon } from './ClockIcon';
import { GameIcon } from './GameIcon';
import { StarIcon } from './StarIcon';
import { StatCard } from './StatCard';
interface StatsOverviewProps {
  stats: GameStats;
}
export const StatsOverview = memo<StatsOverviewProps>(({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <StatCard label="총 게임" value={stats.totalGames.toString()} icon={<GameIcon />} color="blue" />
    <StatCard label="완료율" value={`${stats.completionRate.toFixed(0)}%`} icon={<CheckIcon />} color="emerald" />
    <StatCard label="평균 시간" value={formatTime(stats.averageTime)} icon={<ClockIcon />} color="amber" />
    <StatCard label="최고 포인트" value={formatScore(stats.bestScore)} icon={<StarIcon />} color="rose" />
  </div>
));

StatsOverview.displayName = 'StatsOverview';
