'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueryKey } from '../constants';
import { sendMessage } from '../services';
import type { ChatMessage } from '../types';

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
      queryClient.setQueryData<ChatMessage[]>(
        chatQueryKey(roomId),
        (prev) => {
          const list = prev ?? [];
          return list.some((m) => m.id === message.id)
            ? list
            : [...list, message];
        },
      );
    },
  });
}
