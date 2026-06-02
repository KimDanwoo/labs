'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@entities/auth/model/hooks';
import { useGameSync } from '@entities/game/model/hooks';

type SyncProviderProps = {
  children: React.ReactNode;
};

export default function SyncProvider({ children }: SyncProviderProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  const { user, isLoading, signInAnonymously } = useAuth();
  useGameSync(isAdmin ? null : (user?.id ?? null));

  useEffect(() => {
    if (isAdmin) return;
    if (!isLoading && !user) {
      signInAnonymously().catch(() => {});
    }
  }, [isAdmin, isLoading, user, signInAnonymously]);

  return <>{children}</>;
}
