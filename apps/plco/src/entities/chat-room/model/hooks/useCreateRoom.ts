'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myRoomsQueryKey } from '../constants';
import { createRoom } from '../services';

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      nickname,
      isPublic = false,
    }: {
      name: string;
      nickname: string;
      isPublic?: boolean;
    }) => createRoom(name, nickname, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
