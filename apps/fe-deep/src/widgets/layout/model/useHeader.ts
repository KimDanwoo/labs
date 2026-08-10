'use client';

import { getDueCardCount, syncProgress } from '@entities/progress';
import { clearUserIdCache } from '@entities/progress/services';
import { isAdmin } from '@features/auth';
import { createClient } from '@shared/config/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};
const getServerDueCount = () => 0;

/**
 * Header의 인증 상태, 복습 대기 수, 모바일 메뉴 오픈 상태를 관리한다.
 */
export function useHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);
  // localStorage는 서버에 없으므로 하이드레이션 후에 읽는다. 서버 스냅샷 0 → 마크업 불일치 없음.
  const localDueCount = useSyncExternalStore(subscribeNever, getDueCardCount, getServerDueCount);
  const [syncedDueCount, setSyncedDueCount] = useState<number | null>(null);
  const dueCount = syncedDueCount ?? localDueCount;

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
        syncProgress()
          .then(() => {
            setSyncedDueCount(getDueCardCount());
          })
          .catch(() => {});
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
