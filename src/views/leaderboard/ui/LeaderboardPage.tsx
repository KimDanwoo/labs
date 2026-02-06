"use client";

import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useLeaderboard } from "@features/leaderboard/model/hooks/useLeaderboard";
import { LeaderboardFilters, LeaderboardTable } from "@features/leaderboard/ui";
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
    <main className="min-h-svh bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 text-slate-600 hover:text-slate-800",
              "transition-colors",
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">게임으로</span>
          </Link>

          <h1 className="text-lg font-bold text-slate-800">랭킹</h1>

          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <LeaderboardFilters
          difficulty={difficulty}
          gameMode={gameMode}
          onDifficultyChange={setDifficulty}
          onGameModeChange={setGameMode}
        />

        {/* Leaderboard Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
          {error ? (
            <div className="text-center py-12 text-rose-500">
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
