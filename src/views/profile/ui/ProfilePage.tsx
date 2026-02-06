"use client";

import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useGameStats } from "@features/game-stats/model/hooks/useGameStats";
import { StatsOverview, StatsByDifficulty } from "@features/game-stats/ui";
import { useProfile } from "@features/profile/model/hooks/useProfile";
import { ProfileCard, RecentGames } from "@features/profile/ui";
import { ThemeToggle } from "@features/theme/ui/ThemeToggle";
import { cn } from "@shared/model/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const ProfilePage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { stats, statsByDifficulty, isLoading: statsLoading } = useGameStats();
  const {
    recentGames, isLoading: gamesLoading, error: gamesError,
  } = useProfile();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

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

          <h1 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">프로필</h1>

          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Card */}
        <ProfileCard user={user} stats={stats} />

        {/* Stats Overview */}
        {stats && !statsLoading && <StatsOverview stats={stats} />}

        {/* Stats by Difficulty */}
        {statsByDifficulty.length > 0 && !statsLoading && (
          <StatsByDifficulty stats={statsByDifficulty} />
        )}

        {/* Recent Games */}
        <RecentGames
          games={recentGames}
          isLoading={gamesLoading}
          error={gamesError}
        />
      </div>
    </main>
  );
};
