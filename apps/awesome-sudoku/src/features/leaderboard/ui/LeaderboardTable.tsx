"use client";

import { GameRecord } from "@entities/game-record/model/types";
import { getRecordPoint } from "@entities/game-record/model/utils";
import {
  GAME_LEVEL_LABELS, GAME_MODE,
} from "@entities/game/model/constants";
import { formatTime } from "@features/sudoku-game/model/utils";
import { cn } from "@shared/model/utils";
import Image from "next/image";
import { memo } from "react";
import { RankBadge } from "./RankBadge";

interface LeaderboardTableProps {
  records: GameRecord[];
  isLoading: boolean;
  currentUserId?: string;
}

export const LeaderboardTable = memo<
  LeaderboardTableProps
>(({ records, isLoading, currentUserId }) => {
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-12"
      >
        <div
          className={cn(
            "animate-spin w-8 h-8 border-3",
            "border-[rgb(var(--color-accent))]",
            "border-t-transparent rounded-full",
          )}
        />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12",
          "text-[rgb(var(--color-text-secondary))]",
        )}
      >
        <p>아직 기록이 없습니다.</p>
        <p className="text-sm mt-1">
          첫 번째 기록을 남겨보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <caption className="sr-only">
          리더보드 순위표
        </caption>
        <thead>
          <tr
            className={cn(
              "text-left text-xs",
              "text-[rgb(var(--color-text-secondary))]",
              "border-b",
              "border-[rgb(var(--color-border-light))]",
            )}
          >
            <th className="pb-3 pl-3 font-medium">
              순위
            </th>
            <th className="pb-3 font-medium">
              플레이어
            </th>
            <th className="pb-3 font-medium">포인트</th>
            <th className="pb-3 font-medium hidden sm:table-cell">
              시간
            </th>
            <th className="pb-3 font-medium hidden md:table-cell">
              난이도
            </th>
            <th className="pb-3 font-medium hidden md:table-cell">
              모드
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const rank = index + 1;
            const isMe = record.userId === currentUserId;
            const point = getRecordPoint(record);
            const diffLabel =
              GAME_LEVEL_LABELS[
                record.difficulty as
                  keyof typeof GAME_LEVEL_LABELS
              ] || record.difficulty;

            return (
              <tr
                key={record.id}
                className={cn(
                  "border-b",
                  "border-[rgb(var(--color-divider))]",
                  "hover:bg-[rgb(var(--color-hover))]",
                  "transition-colors",
                  isMe && cn(
                    "bg-[rgb(var(--color-accent-light))]",
                    "hover:bg-[rgb(var(--color-accent-light))]",
                  ),
                )}
              >
                <td className="py-3 pl-3">
                  <RankBadge rank={rank} />
                </td>
                <td className="py-3">
                  <div
                    className="flex items-center gap-2"
                  >
                    {record.userPhotoURL ? (
                      <Image
                        src={record.userPhotoURL}
                        alt={`${record.userDisplayName} 프로필`}
                        width={32}
                        height={32}
                        className={cn(
                          "w-8 h-8 rounded-full",
                          "object-cover",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full",
                          "bg-[rgb(var(--color-bg-tertiary))]",
                          "flex items-center justify-center",
                          "text-[rgb(var(--color-text-secondary))]",
                          "text-sm font-medium",
                        )}
                      >
                        {record.userDisplayName
                          ?.charAt(0) || "?"}
                      </div>
                    )}
                    <span
                      className={cn(
                        "font-medium truncate",
                        "max-w-[120px]",
                        isMe
                          ? "text-[rgb(var(--color-accent))]"
                          : "text-[rgb(var(--color-text-primary))]",
                      )}
                    >
                      {record.userDisplayName}
                      {isMe && (
                        <span
                          className={cn(
                            "ml-1 text-xs",
                            "text-[rgb(var(--color-accent))]",
                          )}
                        >
                          (나)
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "font-bold font-tabular",
                      "text-[rgb(var(--color-text-primary))]",
                    )}
                  >
                    {point}
                  </span>
                </td>
                <td className="py-3 hidden sm:table-cell">
                  <span
                    className={cn(
                      "font-mono font-tabular",
                      "text-[rgb(var(--color-text-secondary))]",
                    )}
                  >
                    {formatTime(record.completionTime)}
                  </span>
                </td>
                <td className="py-3 hidden md:table-cell">
                  <span
                    className={cn(
                      "text-sm",
                      "text-[rgb(var(--color-text-secondary))]",
                    )}
                  >
                    {diffLabel}
                  </span>
                </td>
                <td className="py-3 hidden md:table-cell">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      record.gameMode === GAME_MODE.KILLER
                        ? cn(
                          "bg-[rgb(var(--color-error-bg))]",
                          "text-[rgb(var(--color-error-text))]",
                        )
                        : cn(
                          "bg-[rgb(var(--color-bg-tertiary))]",
                          "text-[rgb(var(--color-text-secondary))]",
                        ),
                    )}
                  >
                    {record.gameMode === GAME_MODE.KILLER
                      ? "킬러"
                      : "클래식"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

LeaderboardTable.displayName = "LeaderboardTable";
