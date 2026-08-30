'use client';

import { chatQueryKey } from '@features/chat/model/constants';
import { deleteMessage } from '@features/chat/model/services';
import type { ChatMessage } from '@features/chat/model/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** 관리자 메시지 삭제. 성공 시 캐시에서 즉시 제거하고, Realtime 으로 다른 클라이언트에도 반영된다. */
export function useDeleteChat(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ChatMessage[]>(chatQueryKey(roomId), (prev) => (prev ?? []).filter((m) => m.id !== id));
    },
  });
}
