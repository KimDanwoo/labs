'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CharacterId } from '@shared/types';
import { chatQueryKey } from '../constants';
import { sendMessage } from '../services';
import type { ChatMessage } from '../types';

type SendArgs = {
  userId: string;
  nickname: string;
  message: string;
};

export function useSendChat(characterId: CharacterId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: SendArgs) => sendMessage({ characterId, ...args }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessage[]>(
        chatQueryKey(characterId),
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
