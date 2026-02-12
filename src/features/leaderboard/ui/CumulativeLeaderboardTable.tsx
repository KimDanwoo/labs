"use client";

import { CumulativePointsEntry } from "@features/game-record/model/services/gameRecordService";
import { cn } from "@shared/model/utils";
import Image from "next/image";
import { memo } from "react";
import { RankBadge } from "./RankBadge";

interface CumulativeLeaderboardTableProps {
  entries: CumulativePointsEntry[];
  isLoading: boolean;
  currentUserId?: string;
}

export const CumulativeLeaderboardTable = memo<
  CumulativeLeaderboardTableProps
>(({ entries, isLoading, currentUserId }) => {
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

  if (entries.length === 0) {
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
          누적 포인트 순위표
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
            <th className="pb-3 font-medium">
              누적 포인트
            </th>
            <th className="pb-3 font-medium hidden sm:table-cell">
              게임 수
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isMe = entry.userId === currentUserId;

            return (
              <tr
                key={entry.userId}
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
                    {entry.userPhotoURL ? (
                      <Image
                        src={entry.userPhotoURL}
                        alt={`${entry.userDisplayName} 프로필`}
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
                        {entry.userDisplayName
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
                      {entry.userDisplayName}
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
                    {entry.totalPoints}
                  </span>
                </td>
                <td className="py-3 hidden sm:table-cell">
                  <span
                    className={cn(
                      "text-[rgb(var(--color-text-secondary))]",
                      "font-tabular",
                    )}
                  >
                    {entry.gamesCount}회
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

CumulativeLeaderboardTable.displayName =
  "CumulativeLeaderboardTable";
