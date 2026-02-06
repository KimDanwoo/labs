import { GameRecord } from "@entities/game-record/model/types";
import { getUserRecords } from "@features/game-record/model/services/gameRecordService";
import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useCallback, useEffect, useState } from "react";

interface UseProfileResult {
  recentGames: GameRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfile(): UseProfileResult {
  const [recentGames, setRecentGames] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user = useAuthStore((state) => state.user);

  const fetch = useCallback(async () => {
    if (!user) {
      setRecentGames([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const records = await getUserRecords(user.uid, 10);
      setRecentGames(records);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("데이터 로드 실패"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { recentGames, isLoading, error, refetch: fetch };
}
