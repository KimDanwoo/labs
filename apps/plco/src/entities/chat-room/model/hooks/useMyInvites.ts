'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { myInvitesQueryKey } from '../constants';
import { fetchMyInvites, joinInvitesChannel } from '../services';
import type { Invite } from '../types';

/**
 * 나에게 온 pending 초대 목록 (React Query).
 * Supabase Realtime로 신규 초대를 실시간 수신해 캐시에 prepend한다.
 */
export function useMyInvites(userId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: myInvitesQueryKey(),
    queryFn: fetchMyInvites,
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = joinInvitesChannel({
      userId,
      onInvite: (invite) => {
        queryClient.setQueryData<Invite[]>(myInvitesQueryKey(), (prev) => {
          const list = prev ?? [];
          return list.some((i) => i.id === invite.id)
            ? list
            : [invite, ...list];
        });
      },
    });

    return unsubscribe;
  }, [userId, queryClient]);

  return query;
}
