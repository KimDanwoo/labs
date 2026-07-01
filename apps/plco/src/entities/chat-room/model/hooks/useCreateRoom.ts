'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myRoomsQueryKey } from '../constants';
import { createRoom } from '../services';

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, nickname }: { name: string; nickname: string }) =>
      createRoom(name, nickname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myRoomsQueryKey() });
    },
  });
}
