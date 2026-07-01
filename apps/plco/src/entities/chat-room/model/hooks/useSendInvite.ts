'use client';

import { useMutation } from '@tanstack/react-query';
import { sendInvite } from '../services';

export function useSendInvite() {
  return useMutation({
    mutationFn: ({
      roomId,
      inviteeId,
    }: {
      roomId: string;
      inviteeId: string;
    }) => sendInvite(roomId, inviteeId),
  });
}
