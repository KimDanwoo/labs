import { GameRecord } from '@entities/game-record/model/types';
import { getLeaderboard, LeaderboardQuery } from '@features/game-record/model/services';
import { useCallback, useEffect, useState } from 'react';

interface UseLeaderboardResult {
  records: GameRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLeaderboard(options: LeaderboardQuery = {}): UseLeaderboardResult {
  const { difficulty, gameMode, recordLimit } = options;
  const queryKey = `${difficulty ?? ''}|${gameMode ?? ''}|${recordLimit ?? ''}`;

  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const [prevKey, setPrevKey] = useState(queryKey);

  // 쿼리 변경 시 렌더 중 상태 보정으로 로딩 리셋 (effect 내 동기 setState 금지 규칙)
  if (prevKey !== queryKey) {
    setPrevKey(queryKey);
    setIsLoading(true);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    getLeaderboard({ difficulty, gameMode, recordLimit })
      .then((data) => {
        if (active) setRecords(data);
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
  }, [difficulty, gameMode, recordLimit, version]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, []);

  return { records, isLoading, error, refetch };
}
