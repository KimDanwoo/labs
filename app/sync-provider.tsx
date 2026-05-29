'use client';

import { useEffect } from 'react';
import { useAuth } from '@entities/auth/model/hooks';
import { useGameSync } from '@entities/game/model/hooks';

type SyncProviderProps = {
  children: React.ReactNode;
};

export default function SyncProvider({ children }: SyncProviderProps) {
  const { user, isLoading, signInAnonymously } = useAuth();
  useGameSync(user?.id ?? null);

  useEffect(() => {
    if (!isLoading && !user) {
      signInAnonymously().catch(() => {});
    }
  }, [isLoading, user, signInAnonymously]);

  return <>{children}</>;
}
