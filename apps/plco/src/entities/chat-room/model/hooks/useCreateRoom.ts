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
