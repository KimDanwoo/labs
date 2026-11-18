'use client';

import { clearUserIdCache, syncProgress } from '@entities/progress';
import { createClient } from '@shared/api/supabaseClient';
import { getIsAdminUser } from '@shared/lib/getIsAdminUser';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

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

  const { data: isAdminUser = false } = useQuery({
    queryKey: ['is-admin-user', user?.id],
    queryFn: () => getIsAdminUser(),
    enabled: user !== null,
    staleTime: Infinity,
  });

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, open, setOpen, isAdminUser, handleSignOut };
}
