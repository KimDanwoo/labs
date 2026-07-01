'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatQueryKey } from '../constants';
import { deleteMessage } from '../services';
import type { ChatMessage } from '../types';

/** 관리자 메시지 삭제. 성공 시 캐시에서 즉시 제거하고, Realtime 으로 다른 클라이언트에도 반영된다. */
export function useDeleteChat(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ChatMessage[]>(
        chatQueryKey(roomId),
        (prev) => (prev ?? []).filter((m) => m.id !== id),
      );
    },
  });
}
