'use client';

import { myRoomsQueryKey } from '@entities/chat-room/model/constants';
import { joinRoomRpc } from '@entities/chat-room/model/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, nickname, password }: { roomId: string; nickname: string; password?: string }) =>
      joinRoomRpc(roomId, nickname, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
