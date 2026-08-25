'use client';

import { syncProgress } from '@entities/progress';
import { clearUserIdCache } from '@entities/progress/services';
import { createClient } from '@shared/config/supabase/client';
import { isAdmin } from '@shared/lib/isAdmin';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

/**
 * Header의 인증 상태와 모바일 메뉴 오픈 상태를 관리한다.
 */
export function useHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      clearUserIdCache();
      if (session?.user) {
        syncProgress().catch(() => {});
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

  return { user, open, setOpen, isAdminUser, handleSignOut };
}
