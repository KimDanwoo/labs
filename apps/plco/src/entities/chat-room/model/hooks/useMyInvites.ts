'use client';

import { myInvitesQueryKey } from '@entities/chat-room/model/constants';
import { fetchMyInvites, joinInvitesChannel } from '@entities/chat-room/model/services';
import type { Invite } from '@entities/chat-room/model/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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
    if (!userId) return undefined;

    const unsubscribe = joinInvitesChannel({
      userId,
      onInvite: (invite) => {
        queryClient.setQueryData<Invite[]>(myInvitesQueryKey(), (prev) => {
          const list = prev ?? [];
          return list.some((i) => i.id === invite.id) ? list : [invite, ...list];
        });
      },
    });

    return unsubscribe;
  }, [userId, queryClient]);

  return query;
}
