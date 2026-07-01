'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myRoomsQueryKey } from '../constants';
import { joinRoomRpc } from '../services';

export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, nickname }: { roomId: string; nickname: string }) =>
      joinRoomRpc(roomId, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
