"use client";

import { GameStats } from "@features/game-stats/model/types";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { formatTime } from "@features/sudoku-game/model/utils";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "amber" | "rose";
}

const colorStyles = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
};

const StatCard = memo<StatCardProps>(({ label, value, icon, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
    <div
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
        colorStyles[color],
      )}
    >
      {icon}
    </div>
    <p className="text-2xl font-bold text-slate-800 font-tabular">{value}</p>
    <p className="text-sm text-slate-500 mt-0.5">{label}</p>
  </div>
));

StatCard.displayName = "StatCard";

interface StatsOverviewProps {
  stats: GameStats;
}

const GameIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d={
        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" +
        "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      }
    />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d={
        "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915" +
        "c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674" +
        "c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888" +
        "c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888" +
        "c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      }
    />
  </svg>
);

export const StatsOverview = memo<StatsOverviewProps>(({ stats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <StatCard label="총 게임" value={stats.totalGames.toString()} icon={<GameIcon />} color="blue" />
    <StatCard
      label="완료율"
      value={`${stats.completionRate.toFixed(0)}%`}
      icon={<CheckIcon />}
      color="emerald"
    />
    <StatCard
      label="평균 시간"
      value={formatTime(stats.averageTime)}
      icon={<ClockIcon />}
      color="amber"
    />
    <StatCard
      label="최고 점수"
      value={formatScore(stats.bestScore)}
      icon={<StarIcon />}
      color="rose"
    />
  </div>
));

StatsOverview.displayName = "StatsOverview";
