import { GameRecord } from "@entities/game-record/model/types";
import { getLeaderboard, LeaderboardQuery } from "@features/game-record/model/services/gameRecordService";
import { useCallback, useEffect, useState } from "react";

interface UseLeaderboardResult {
  records: GameRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLeaderboard(options: LeaderboardQuery = {}): UseLeaderboardResult {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard(options);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("데이터 로드 실패"));
    } finally {
      setIsLoading(false);
    }
  }, [options.difficulty, options.gameMode, options.recordLimit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { records, isLoading, error, refetch: fetch };
}
