'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myRoomsQueryKey } from '../constants';
import { joinRoomRpc } from '../services';

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      nickname,
      password,
    }: {
      roomId: string;
      nickname: string;
      password?: string;
    }) => joinRoomRpc(roomId, nickname, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
