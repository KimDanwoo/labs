'use client';

import { useQuery } from '@tanstack/react-query';
import { myRoomsQueryKey } from '../constants';
import { fetchMyRooms } from '../services';

export function useMyRooms() {
  return useQuery({
    queryKey: myRoomsQueryKey(),
    queryFn: fetchMyRooms,
  });
}
