import { GameRecord } from '@entities/game-record/model/types';
import { userAtom } from '@features/auth/model/atoms';
import { getUserRecords } from '@features/game-record/model/services';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

interface UseProfileResult {
  recentGames: GameRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfile(): UseProfileResult {
  const user = useAtomValue(userAtom);
  const uid = user?.uid ?? null;

  const [recentGames, setRecentGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(uid !== null);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);
  const [prevUid, setPrevUid] = useState(uid);

  // 유저 변경 시 렌더 중 상태 보정으로 리셋 (effect 내 동기 setState 금지 규칙)
  if (prevUid !== uid) {
    setPrevUid(uid);
    setRecentGames([]);
    setError(null);
    setIsLoading(uid !== null);
  }

  useEffect(() => {
    if (!uid) return undefined;

    let active = true;
    getUserRecords(uid, 10)
      .then((records) => {
        if (active) setRecentGames(records);
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
  }, [uid, version]);

  const refetch = useCallback(() => {
    if (!uid) return;
    setIsLoading(true);
    setError(null);
    setVersion((v) => v + 1);
  }, [uid]);

  return { recentGames, isLoading, error, refetch };
}
