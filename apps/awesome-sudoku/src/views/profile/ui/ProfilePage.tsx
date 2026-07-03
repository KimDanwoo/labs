'use client';

import { isAuthenticatedAtom, userAtom } from '@features/auth/model/atoms';
import { useGameStats } from '@features/game-stats/model/hooks';
import { StatsByDifficulty, StatsOverview } from '@features/game-stats/ui';
import { useProfile } from '@features/profile/model/hooks';
import { ProfileCard, RecentGames } from '@features/profile/ui';
import { ThemeToggle } from '@features/theme/ui/ThemeToggle';
import { SubpageHeader } from '@shared/ui';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const ProfilePage = () => {
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  const { stats, statsByDifficulty, isLoading: statsLoading } = useGameStats();
  const { recentGames, isLoading: gamesLoading, error: gamesError } = useProfile();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-svh bg-[rgb(var(--color-surface-secondary))]">
      <SubpageHeader title="프로필" rightAction={<ThemeToggle />} />

      {/* Content */}
      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Card */}
        <ProfileCard user={user} stats={stats} />

        {/* Stats Overview */}
        {stats && !statsLoading && <StatsOverview stats={stats} />}

        {/* Stats by Difficulty */}
        {statsByDifficulty.length > 0 && !statsLoading && <StatsByDifficulty stats={statsByDifficulty} />}

        {/* Recent Games */}
        <RecentGames games={recentGames} isLoading={gamesLoading} error={gamesError} />
      </div>
    </main>
  );
};
