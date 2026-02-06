"use client";

import { GameRecord } from "@entities/game-record/model/types";
import { GAME_LEVEL_LABELS, GAME_MODE } from "@entities/game/model/constants";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { formatTime } from "@features/sudoku-game/model/utils";
import { cn } from "@shared/model/utils";
import { memo } from "react";

const RankBadge = memo<{ rank: number }>(({ rank }) => {
  if (rank <= 3) {
    const colors = {
      1: "from-amber-400 to-yellow-500 text-white shadow-amber-200 dark:shadow-amber-800",
      2: "from-slate-300 to-slate-400 text-white shadow-slate-200 dark:shadow-slate-700",
      3: "from-orange-300 to-orange-400 text-white shadow-orange-200 dark:shadow-orange-800",
    };

    return (
      <div
        className={cn(
          "w-7 h-7 rounded-full bg-gradient-to-b flex items-center justify-center",
          "text-sm font-bold shadow-sm",
          colors[rank as 1 | 2 | 3],
        )}
      >
        {rank}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-7 h-7 flex items-center justify-center",
        "text-sm font-medium text-[rgb(var(--color-text-secondary))]",
      )}
    >
      {rank}
    </div>
  );
});

RankBadge.displayName = "RankBadge";

interface LeaderboardTableProps {
  records: GameRecord[];
  isLoading: boolean;
  currentUserId?: string;
}

export const LeaderboardTable = memo<LeaderboardTableProps>(
  ({ records, isLoading, currentUserId }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div
            className={cn(
              "animate-spin w-8 h-8 border-3",
              "border-[rgb(var(--color-accent))] border-t-transparent rounded-full",
            )}
          />
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-12 text-[rgb(var(--color-text-secondary))]">
          <p>아직 기록이 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 기록을 남겨보세요!</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={cn(
                "text-left text-xs text-[rgb(var(--color-text-secondary))]",
                "border-b border-[rgb(var(--color-border-light))]",
              )}
            >
              <th className="pb-3 pl-3 font-medium">순위</th>
              <th className="pb-3 font-medium">플레이어</th>
              <th className="pb-3 font-medium">점수</th>
              <th className="pb-3 font-medium hidden sm:table-cell">시간</th>
              <th className="pb-3 font-medium hidden md:table-cell">난이도</th>
              <th className="pb-3 font-medium hidden md:table-cell">모드</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const rank = index + 1;
              const isCurrentUser = record.userId === currentUserId;
              const difficultyLabel =
                GAME_LEVEL_LABELS[record.difficulty as keyof typeof GAME_LEVEL_LABELS] ||
                record.difficulty;

              return (
                <tr
                  key={record.id}
                  className={cn(
                    "border-b border-[rgb(var(--color-divider))] hover:bg-[rgb(var(--color-hover))] transition-colors",
                    isCurrentUser && "bg-[rgb(var(--color-accent-light))] hover:bg-[rgb(var(--color-accent-light))]",
                  )}
                >
                  {/* Rank */}
                  <td className="py-3 pl-3">
                    <RankBadge rank={rank} />
                  </td>

                  {/* Player */}
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {record.userPhotoURL ? (
                        <img
                          src={record.userPhotoURL}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full bg-[rgb(var(--color-bg-tertiary))]",
                            "flex items-center justify-center",
                            "text-[rgb(var(--color-text-secondary))] text-sm font-medium",
                          )}
                        >
                          {record.userDisplayName?.charAt(0) || "?"}
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium truncate max-w-[120px]",
                          isCurrentUser ? "text-[rgb(var(--color-accent))]" : "text-[rgb(var(--color-text-primary))]",
                        )}
                      >
                        {record.userDisplayName}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-[rgb(var(--color-accent))]">(나)</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3">
                    <span className="font-bold font-tabular text-[rgb(var(--color-text-primary))]">
                      {formatScore(record.score)}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="py-3 hidden sm:table-cell">
                    <span className="font-mono text-[rgb(var(--color-text-secondary))] font-tabular">
                      {formatTime(record.completionTime)}
                    </span>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 hidden md:table-cell">
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">{difficultyLabel}</span>
                  </td>

                  {/* Mode */}
                  <td className="py-3 hidden md:table-cell">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        record.gameMode === GAME_MODE.KILLER
                          ? "bg-[rgb(var(--color-error-bg))] text-[rgb(var(--color-error-text))]"
                          : "bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-secondary))]",
                      )}
                    >
                      {record.gameMode === GAME_MODE.KILLER ? "킬러" : "클래식"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
);

LeaderboardTable.displayName = "LeaderboardTable";
