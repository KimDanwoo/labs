'use client';

import { publicRoomsQueryKey } from '@entities/chat-room/model/constants';
import { fetchPublicRooms } from '@entities/chat-room/model/services';
import { useQuery } from '@tanstack/react-query';

export function usePublicRooms() {
  return useQuery({
    queryKey: publicRoomsQueryKey(),
    queryFn: fetchPublicRooms,
  });
}
