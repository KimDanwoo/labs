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
      1: "from-amber-400 to-yellow-500 text-white shadow-amber-200",
      2: "from-slate-300 to-slate-400 text-white shadow-slate-200",
      3: "from-orange-300 to-orange-400 text-white shadow-orange-200",
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
    <div className="w-7 h-7 flex items-center justify-center text-sm font-medium text-slate-500">
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
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (records.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <p>아직 기록이 없습니다.</p>
          <p className="text-sm mt-1">첫 번째 기록을 남겨보세요!</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
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
                    "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                    isCurrentUser && "bg-blue-50 hover:bg-blue-100",
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
                            "w-8 h-8 rounded-full bg-slate-200",
                            "flex items-center justify-center text-slate-500 text-sm font-medium",
                          )}
                        >
                          {record.userDisplayName?.charAt(0) || "?"}
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium truncate max-w-[120px]",
                          isCurrentUser ? "text-blue-600" : "text-slate-700",
                        )}
                      >
                        {record.userDisplayName}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-blue-500">(나)</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3">
                    <span className="font-bold font-tabular text-slate-800">
                      {formatScore(record.score)}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="py-3 hidden sm:table-cell">
                    <span className="font-mono text-slate-600 font-tabular">
                      {formatTime(record.completionTime)}
                    </span>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 hidden md:table-cell">
                    <span className="text-sm text-slate-600">{difficultyLabel}</span>
                  </td>

                  {/* Mode */}
                  <td className="py-3 hidden md:table-cell">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        record.gameMode === GAME_MODE.KILLER
                          ? "bg-rose-100 text-rose-600"
                          : "bg-slate-100 text-slate-600",
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
