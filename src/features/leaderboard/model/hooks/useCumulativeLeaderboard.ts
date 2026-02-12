import {
  CumulativePointsEntry,
  getCumulativeLeaderboard,
} from "@features/game-record/model/services/gameRecordService";
import { useCallback, useEffect, useState } from "react";

interface UseCumulativeLeaderboardResult {
  entries: CumulativePointsEntry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCumulativeLeaderboard():
  UseCumulativeLeaderboardResult {
  const [entries, setEntries] = useState<
    CumulativePointsEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCumulativeLeaderboard();
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("데이터 로드 실패"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, isLoading, error, refetch: fetch };
}
