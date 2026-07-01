'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myInvitesQueryKey, myRoomsQueryKey } from '../constants';
import { acceptInvite, declineInvite } from '../services';
import type { Invite } from '../types';
import { INVITE_STATUS } from '../types';

/** 초대 수락 or 거절. 성공 시 캐시에서 해당 초대 제거 + (수락이면) 방 목록 갱신. */
export function useRespondInvite() {
  const queryClient = useQueryClient();

  const removeInvite = (inviteId: string) => {
    queryClient.setQueryData<Invite[]>(myInvitesQueryKey(), (prev) =>
      (prev ?? []).filter((i) => i.id !== inviteId),
    );
  };

  const accept = useMutation({
    mutationFn: ({
      inviteId,
      nickname,
    }: {
      inviteId: string;
      nickname: string;
    }) => acceptInvite(inviteId, nickname),
    onSuccess: (_roomId, { inviteId }) => {
      removeInvite(inviteId);
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });

  const decline = useMutation({
    mutationFn: ({ inviteId }: { inviteId: string }) =>
      declineInvite(inviteId),
    onSuccess: (_data, { inviteId }) => {
      removeInvite(inviteId);
    },
  });

  return { accept, decline, INVITE_STATUS };
}
