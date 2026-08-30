'use client';

import { sendInvite } from '@entities/chat-room/model/services';
import { useMutation } from '@tanstack/react-query';

export function useSendInvite() {
  return useMutation({
    mutationFn: ({ roomId, inviteeId }: { roomId: string; inviteeId: string }) => sendInvite(roomId, inviteeId),
  });
}
