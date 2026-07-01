'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatQueryKey } from '../constants';
import { fetchMessages, joinRoom } from '../services';
import type { ChatMessage, ChatPresenceUser } from '../types';

type ChatRoomIdentity = {
  userId: string | null;
  nickname: string;
  characterId?: string | null;
};

function appendUnique(
  prev: ChatMessage[] | undefined,
  message: ChatMessage,
): ChatMessage[] {
  const list = prev ?? [];
  return list.some((m) => m.id === message.id) ? list : [...list, message];
}

/**
 * 방의 초기 메시지는 React Query로 불러오고, 이후 신규 메시지와 접속자(presence)는
 * Realtime 채널로 처리한다. 모달이 열려 있는 동안만 입장한다.
 */
export function useChatRoom(roomId: string, identity: ChatRoomIdentity) {
  const queryClient = useQueryClient();
  const { userId, nickname, characterId = null } = identity;
  const [onlineUsers, setOnlineUsers] = useState<ChatPresenceUser[]>([]);

  const query = useQuery({
    queryKey: chatQueryKey(roomId),
    queryFn: () => fetchMessages(roomId),
  });

  useEffect(() => {
    const leave = joinRoom({
      roomId,
      identity: userId ? { userId, nickname, characterId } : null,
      onInsert: (message) =>
        queryClient.setQueryData<ChatMessage[]>(
          chatQueryKey(roomId),
          (prev) => appendUnique(prev, message),
        ),
      onDelete: (id) =>
        queryClient.setQueryData<ChatMessage[]>(
          chatQueryKey(roomId),
          (prev) => (prev ?? []).filter((m) => m.id !== id),
        ),
      onPresenceSync: setOnlineUsers,
    });
    return leave;
  }, [roomId, userId, nickname, characterId, queryClient]);

  return {
    messages: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    onlineUsers,
  };
}
