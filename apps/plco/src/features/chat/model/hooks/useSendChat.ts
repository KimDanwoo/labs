'use client';

import { chatQueryKey } from '@features/chat/model/constants';
import { sendMessage } from '@features/chat/model/services';
import type { ChatMessage } from '@features/chat/model/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type SendArgs = {
  userId: string;
  nickname: string;
  message: string;
};

export function useSendChat(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: SendArgs) => sendMessage({ roomId, ...args }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(chatQueryKey(roomId), (prev) => {
        const list = prev ?? [];
        return list.some((m) => m.id === message.id) ? list : [...list, message];
      });
    },
  });
}
