'use client';

import { isAuthenticatedAtom, userAtom } from '@entities/session';
import { ThemeToggle } from '@features/theme';
import { SubpageHeader } from '@shared/ui/SubpageHeader';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGameStats } from '../model/game-stats/hooks/useGameStats';
import { useProfile } from '../model/hooks/useProfile';
import { StatsByDifficulty } from './game-stats/StatsByDifficulty';
import { StatsOverview } from './game-stats/StatsOverview';
import { ProfileCard } from './ProfileCard';
import { RecentGames } from './RecentGames';

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

      <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <ProfileCard user={user} stats={stats} />

        {stats && !statsLoading && <StatsOverview stats={stats} />}

        {statsByDifficulty.length > 0 && !statsLoading && <StatsByDifficulty stats={statsByDifficulty} />}

        <RecentGames games={recentGames} isLoading={gamesLoading} error={gamesError} />
      </div>
    </main>
  );
};
