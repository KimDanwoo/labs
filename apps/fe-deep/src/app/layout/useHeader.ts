'use client';

import { clearUserIdCache, syncProgress } from '@entities/progress';
import { createClient } from '@shared/api/supabaseClient';
import { isAdmin } from '@shared/lib/isAdmin';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

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
