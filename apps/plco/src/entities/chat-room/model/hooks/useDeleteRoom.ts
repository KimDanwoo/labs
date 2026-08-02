'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myRoomsQueryKey, publicRoomsQueryKey } from '../constants';
import { deleteRoom } from '../services';

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
