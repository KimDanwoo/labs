import { LEADERBOARD_RECORD_LIMIT } from "@entities/game-record/model/constants";
import { GameRecord } from "@entities/game-record/model/types";
import { getRecordPoint } from "@entities/game-record/model/utils";
import { GAME_LEVEL } from "@entities/game/model/constants";
import { Difficulty } from "@entities/game/model/types";
import { getUserRecords } from "@features/game-record/model/services/gameRecordService";
import { useAuthStore } from "@features/auth/model/stores/authStore";
import {
  GameStats, DifficultyStats,
} from "@features/game-stats/model/types";
import { useCallback, useEffect, useState } from "react";

interface UseGameStatsResult {
  stats: GameStats | null;
  statsByDifficulty: DifficultyStats[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const INITIAL_STATS: GameStats = {
  totalGames: 0,
  completedGames: 0,
  completionRate: 0,
  totalPlayTime: 0,
  averageTime: 0,
  bestScore: 0,
  totalScore: 0,
  totalPoints: 0,
};

function calculateStats(
  records: GameRecord[],
): GameStats {
  if (records.length === 0) return INITIAL_STATS;

  const completed = records.filter((r) => r.isSuccess);
  const totalPlayTime = records.reduce(
    (sum, r) => sum + r.completionTime, 0,
  );
  const totalPoints = completed.reduce(
    (sum, r) => sum + getRecordPoint(r), 0,
  );
  const bestScore = completed.length > 0
    ? Math.max(...completed.map((r) => getRecordPoint(r)))
    : 0;

  return {
    totalGames: records.length,
    completedGames: completed.length,
    completionRate: records.length > 0
      ? (completed.length / records.length) * 100
      : 0,
    totalPlayTime,
    averageTime: completed.length > 0
      ? Math.round(totalPlayTime / completed.length)
      : 0,
    bestScore,
    totalScore: totalPoints,
    totalPoints,
  };
}

function calculateDifficultyStats(
  records: GameRecord[],
): DifficultyStats[] {
  const difficulties = [
    GAME_LEVEL.EASY,
    GAME_LEVEL.MEDIUM,
    GAME_LEVEL.HARD,
    GAME_LEVEL.EXPERT,
  ] as Difficulty[];

  return difficulties.map((difficulty) => {
    const filtered = records.filter(
      (r) => r.difficulty === difficulty,
    );
    const completed = filtered.filter((r) => r.isSuccess);

    return {
      difficulty,
      gamesPlayed: filtered.length,
      completedGames: completed.length,
      averageTime: completed.length > 0
        ? Math.round(
          completed.reduce(
            (sum, r) => sum + r.completionTime, 0,
          ) / completed.length,
        )
        : 0,
      bestTime: completed.length > 0
        ? Math.min(
          ...completed.map((r) => r.completionTime),
        )
        : 0,
      bestScore: completed.length > 0
        ? Math.max(...completed.map((r) => getRecordPoint(r)))
        : 0,
    };
  });
}

export function useGameStats(): UseGameStatsResult {
  const [stats, setStats] = useState<GameStats | null>(
    null,
  );
  const [statsByDifficulty, setDifficultyStats] = useState<
    DifficultyStats[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user = useAuthStore((state) => state.user);

  const fetch = useCallback(async () => {
    if (!user) {
      setStats(null);
      setDifficultyStats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const records = await getUserRecords(user.uid, LEADERBOARD_RECORD_LIMIT);
      setStats(calculateStats(records));
      setDifficultyStats(
        calculateDifficultyStats(records),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("통계 로드 실패"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    stats, statsByDifficulty,
    isLoading, error, refetch: fetch,
  };
}
