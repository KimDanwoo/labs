import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = 60 * 1000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
