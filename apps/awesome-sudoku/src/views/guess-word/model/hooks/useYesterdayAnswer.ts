'use client';

import { useQuery } from '@tanstack/react-query';
import { GUESS_QUERY_KEY } from '@views/guess-word/config/game';
import { requestYesterday } from '@views/guess-word/lib/guessApi';

export function useYesterdayAnswer(day: number | null): string | null {
  const { data } = useQuery({
    queryKey: GUESS_QUERY_KEY.yesterday(day),
    queryFn: requestYesterday,
    enabled: day !== null,
    staleTime: Infinity,
  });
  return data?.word ?? null;
}
