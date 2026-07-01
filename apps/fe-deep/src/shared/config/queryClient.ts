import { QueryClient } from '@tanstack/react-query';

/** 앱 전체에서 공유하는 QueryClient 팩토리. Provider에서 한 번만 호출한다. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
