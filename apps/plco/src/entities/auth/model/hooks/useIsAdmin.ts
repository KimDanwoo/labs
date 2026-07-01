'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@shared/lib';

/** 현재 게임 세션 유저의 profiles.is_admin 여부. */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setIsAdmin(false);
          setIsChecking(false);
        }
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!active) return;
      setIsAdmin(data?.is_admin === true);
      setIsChecking(false);
    };

    check();
    return () => {
      active = false;
    };
  }, []);

  return { isAdmin, isChecking };
}
