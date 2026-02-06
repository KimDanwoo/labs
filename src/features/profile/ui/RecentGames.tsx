"use client";

import { GameRecord } from "@entities/game-record/model/types";
import { GAME_LEVEL_LABELS, GAME_MODE } from "@entities/game/model/constants";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { formatTime } from "@features/sudoku-game/model/utils";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface RecentGamesProps {
  games: GameRecord[];
  isLoading: boolean;
}

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12 text-slate-500">
    <p>아직 완료한 게임이 없습니다.</p>
    <p className="text-sm mt-1">게임을 완료하면 여기에 표시됩니다.</p>
  </div>
);

export const RecentGames = memo<RecentGamesProps>(({ games, isLoading }) => {
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (games.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="divide-y divide-slate-50">
        {games.map((game) => {
          const difficultyLabel =
            GAME_LEVEL_LABELS[game.difficulty as keyof typeof GAME_LEVEL_LABELS] ||
            game.difficulty;
          const isKiller = game.gameMode === GAME_MODE.KILLER;

          return (
            <div
              key={game.id}
              className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4"
            >
              {/* Status */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  game.isSuccess
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-500",
                )}
              >
                {game.isSuccess ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{difficultyLabel}</span>
                  {isKiller && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">
                      킬러
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {formatTime(game.completionTime)} · 힌트 {game.hintsUsed}회
                </p>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-slate-800 font-tabular">
                  {formatScore(game.score)}
                </p>
                <p className="text-xs text-slate-400">
                  {game.createdAt?.toDate?.()
                    ? new Date(game.createdAt.toDate()).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">최근 게임</h3>
      </div>
      {renderContent()}
    </div>
  );
});

RecentGames.displayName = "RecentGames";
