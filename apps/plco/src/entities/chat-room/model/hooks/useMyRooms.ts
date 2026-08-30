'use client';

import { myRoomsQueryKey } from '@entities/chat-room/model/constants';
import { fetchMyRooms } from '@entities/chat-room/model/services';
import { useQuery } from '@tanstack/react-query';

export function useMyRooms() {
  return useQuery({
    queryKey: myRoomsQueryKey(),
    queryFn: fetchMyRooms,
  });
}
