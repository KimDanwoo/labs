'use client';

import { useQuery } from '@tanstack/react-query';
import { publicRoomsQueryKey } from '../constants';
import { fetchPublicRooms } from '../services';

export function usePublicRooms() {
  return useQuery({
    queryKey: publicRoomsQueryKey(),
    queryFn: fetchPublicRooms,
  });
}
