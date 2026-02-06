"use client";

import { User } from "@entities/auth/model/types";
import { formatScore } from "@features/game-record/model/utils/scoreCalculator";
import { GameStats } from "@features/game-stats/model/types";
import { cn } from "@shared/model/utils";
import { memo } from "react";

interface ProfileCardProps {
  user: User;
  stats: GameStats | null;
}

export const ProfileCard = memo<ProfileCardProps>(({ user, stats }) => (
  <div
    className={cn(
      "bg-[rgb(var(--color-surface-primary))] rounded-2xl shadow-sm",
      "border border-[rgb(var(--color-border-light))] overflow-hidden",
    )}
  >
    <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />

    <div className="px-6 pb-6">
      <div className="-mt-12 mb-4">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "프로필"}
            className={cn(
              "w-24 h-24 rounded-full object-cover",
              "ring-4 ring-[rgb(var(--color-surface-primary))] shadow-lg",
            )}
          />
        ) : (
          <div
            className={cn(
              "w-24 h-24 rounded-full",
              "bg-gradient-to-br from-[rgb(var(--color-bg-tertiary))] to-[rgb(var(--color-border-light))]",
              "ring-4 ring-[rgb(var(--color-surface-primary))] shadow-lg",
              "flex items-center justify-center",
              "text-3xl font-bold text-[rgb(var(--color-text-secondary))]",
            )}
          >
            {user.displayName?.charAt(0) || "?"}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-[rgb(var(--color-text-primary))]">{user.displayName || "익명"}</h2>
      <p className="text-sm text-[rgb(var(--color-text-secondary))]">{user.email}</p>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[rgb(var(--color-border-light))]">
          <div className="text-center">
            <p
              className={cn(
                "text-2xl font-bold font-tabular",
                "text-[rgb(var(--color-text-primary))]",
              )}
            >
              {stats.completedGames}
            </p>
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">완료 게임</p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-2xl font-bold font-tabular",
                "text-[rgb(var(--color-text-primary))]",
              )}
            >
              {formatScore(stats.totalScore)}
            </p>
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">총 점수</p>
          </div>
          <div className="text-center">
            <p
              className={cn(
                "text-2xl font-bold font-tabular",
                "text-[rgb(var(--color-text-primary))]",
              )}
            >
              {formatScore(stats.bestScore)}
            </p>
            <p className="text-xs text-[rgb(var(--color-text-secondary))]">최고 점수</p>
          </div>
        </div>
      )}
    </div>
  </div>
));

ProfileCard.displayName = "ProfileCard";
