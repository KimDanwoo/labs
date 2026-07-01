'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@shared/config/supabase/client';
import { getDueCardCount, syncProgress } from '@entities/progress';
import { clearUserIdCache } from '@entities/progress/services';
import { isAdmin } from '@features/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Header의 인증 상태, 복습 대기 수, 모바일 메뉴 오픈 상태를 관리한다.
 */
export function useHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const [dueCount, setDueCount] = useState(() =>
    typeof window !== 'undefined' ? getDueCardCount() : 0
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      clearUserIdCache();
      if (session?.user) {
        syncProgress().then(() => {
          setDueCount(getDueCardCount());
        }).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdminUser = useMemo(() => isAdmin(user?.email), [user]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, open, setOpen, dueCount, isAdminUser, handleSignOut };
}
