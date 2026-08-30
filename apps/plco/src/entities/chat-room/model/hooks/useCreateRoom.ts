'use client';

import { myRoomsQueryKey } from '@entities/chat-room/model/constants';
import { createRoom } from '@entities/chat-room/model/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      nickname,
      isPublic = false,
      password,
    }: {
      name: string;
      nickname: string;
      isPublic?: boolean;
      password?: string;
    }) => createRoom(name, nickname, isPublic, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
