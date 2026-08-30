'use client';

import { myRoomsQueryKey, publicRoomsQueryKey } from '@entities/chat-room/model/constants';
import { deleteRoom } from '@entities/chat-room/model/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** 방 삭제 (소유자만). 성공 시 내 방·공개 방 목록 캐시를 무효화한다. */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
      queryClient.invalidateQueries({ queryKey: publicRoomsQueryKey() });
    },
  });
}
