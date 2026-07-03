import { CumulativePointsEntry, getCumulativeLeaderboard } from '@features/game-record/model/services';
import { useCallback, useEffect, useState } from 'react';

interface UseCumulativeLeaderboardResult {
  entries: CumulativePointsEntry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCumulativeLeaderboard(): UseCumulativeLeaderboardResult {
  const [entries, setEntries] = useState<CumulativePointsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getCumulativeLeaderboard()
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err : new Error('데이터 로드 실패'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, []);

  return { entries, isLoading, error, refetch };
}
