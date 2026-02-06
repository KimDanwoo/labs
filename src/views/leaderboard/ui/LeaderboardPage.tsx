"use client";

import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useLeaderboard } from "@features/leaderboard/model/hooks/useLeaderboard";
import { LeaderboardFilters, LeaderboardTable } from "@features/leaderboard/ui";
import { ThemeToggle } from "@features/theme/ui/ThemeToggle";
import { cn } from "@shared/model/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

export const LeaderboardPage = () => {
  const [difficulty, setDifficulty] = useState("");
  const [gameMode, setGameMode] = useState("");

  const user = useAuthStore((state) => state.user);

  const options = useMemo(
    () => ({
      difficulty: difficulty || undefined,
      gameMode: gameMode || undefined,
      recordLimit: 100,
    }),
    [difficulty, gameMode],
  );

  const { records, isLoading, error } = useLeaderboard(options);

  return (
    <main className="min-h-svh bg-[rgb(var(--color-surface-secondary))]">
      {/* Header */}
      <header
        className={
          "sticky top-0 z-30 backdrop-blur-xl " +
          "bg-[rgb(var(--color-glass))]/[var(--glass-opacity)] " +
          "border-b border-[rgb(var(--color-border-light))]/50"
        }
      >
        <div
          className={
            "max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-3 " +
            "flex items-center justify-between"
          }
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2",
              "text-[rgb(var(--color-text-secondary))]",
              "hover:text-[rgb(var(--color-text-primary))]",
              "transition-colors",
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">게임으로</span>
          </Link>

          <h1 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">랭킹</h1>

          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <LeaderboardFilters
          difficulty={difficulty}
          gameMode={gameMode}
          onDifficultyChange={setDifficulty}
          onGameModeChange={setGameMode}
        />

        {/* Leaderboard Card */}
        <div
          className={
            "bg-[rgb(var(--color-surface-primary))] " +
            "rounded-2xl shadow-sm " +
            "border border-[rgb(var(--color-border-light))]/50 " +
            "overflow-hidden"
          }
        >
          {error ? (
            <div className="text-center py-12 text-[rgb(var(--color-error))]">
              <p>데이터를 불러오는데 실패했습니다.</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          ) : (
            <LeaderboardTable
              records={records}
              isLoading={isLoading}
              currentUserId={user?.uid}
            />
          )}
        </div>
      </div>
    </main>
  );
};
