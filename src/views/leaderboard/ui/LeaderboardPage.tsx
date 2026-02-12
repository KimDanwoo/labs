"use client";

import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useLeaderboard } from "@features/leaderboard/model/hooks/useLeaderboard";
import { useCumulativeLeaderboard } from "@features/leaderboard/model/hooks/useCumulativeLeaderboard";
import {
  CumulativeLeaderboardTable,
  LeaderboardFilters,
  LeaderboardTable,
} from "@features/leaderboard/ui";
import { cn } from "@shared/model/utils";
import { SubpageHeader } from "@shared/ui";
import { useMemo, useState } from "react";

type LeaderboardTab = "best" | "cumulative";

const ErrorMessage = ({ message }: { message: string }) => (
  <div
    className={cn(
      "text-center py-12",
      "text-[rgb(var(--color-error))]",
    )}
  >
    <p>데이터를 불러오는데 실패했습니다.</p>
    <p className="text-sm mt-1">{message}</p>
  </div>
);

export const LeaderboardPage = () => {
  const [tab, setTab] = useState<LeaderboardTab>("best");
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

  const {
    records, isLoading: bestLoading, error: bestError,
  } = useLeaderboard(options);

  const {
    entries, isLoading: cumLoading, error: cumError,
  } = useCumulativeLeaderboard();

  const tabs: { key: LeaderboardTab; label: string }[] = [
    { key: "best", label: "최고 기록" },
    { key: "cumulative", label: "누적 포인트" },
  ];

  return (
    <main
      className={cn(
        "min-h-svh",
        "bg-[rgb(var(--color-surface-secondary))]",
      )}
    >
      <SubpageHeader title="랭킹" />

      {/* Content */}
      <div
        className={cn(
          "max-w-5xl xl:max-w-6xl mx-auto",
          "px-4 sm:px-6 py-6",
        )}
      >
        {/* Tab Switcher */}
        <div
          className={cn(
            "flex gap-1 mb-6 p-1 rounded-xl",
            "bg-[rgb(var(--color-bg-tertiary))]",
          )}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 py-2 text-sm font-medium",
                "rounded-lg transition-all",
                tab === t.key
                  ? cn(
                    "bg-[rgb(var(--color-surface-primary))]",
                    "text-[rgb(var(--color-text-primary))]",
                    "shadow-sm",
                  )
                  : "text-[rgb(var(--color-text-secondary))]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters (best tab only) */}
        {tab === "best" && (
          <LeaderboardFilters
            difficulty={difficulty}
            gameMode={gameMode}
            onDifficultyChange={setDifficulty}
            onGameModeChange={setGameMode}
          />
        )}

        {/* Leaderboard Card */}
        <div
          className={cn(
            "bg-[rgb(var(--color-surface-primary))]",
            "rounded-2xl shadow-sm",
            "border",
            "border-[rgb(var(--color-border-light))]/50",
            "overflow-hidden",
          )}
        >
          {tab === "best" && !bestError && (
            <LeaderboardTable
              records={records}
              isLoading={bestLoading}
              currentUserId={user?.uid}
            />
          )}
          {tab === "best" && bestError && (
            <ErrorMessage message={bestError.message} />
          )}
          {tab === "cumulative" && !cumError && (
            <CumulativeLeaderboardTable
              entries={entries}
              isLoading={cumLoading}
              currentUserId={user?.uid}
            />
          )}
          {tab === "cumulative" && cumError && (
            <ErrorMessage message={cumError.message} />
          )}
        </div>
      </div>
    </main>
  );
};
