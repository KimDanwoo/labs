import {
  GameRecord, PointResult,
} from "@entities/game-record/model/types";
import { calculatePoint } from "@features/game-record/model/utils/scoreCalculator";
import { saveGameRecord } from "@features/game-record/model/services/gameRecordService";
import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useSudokuStore } from "@features/sudoku-game/model/stores";
import { HINTS_REMAINING } from "@entities/game/model/constants";
import { useShallow } from "zustand/react/shallow";
import { useCallback, useRef, useState } from "react";

interface SaveGameRecordResult {
  save: () => Promise<string | null>;
  isSaving: boolean;
  error: Error | null;
  pointResult: PointResult | null;
}

export function useSaveGameRecord(): SaveGameRecordResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pointResult, setPointResult] =
    useState<PointResult | null>(null);
  const savingRef = useRef(false);

  const user = useAuthStore((state) => state.user);
  const {
    difficulty, gameMode, currentTime,
    hintsRemaining, mistakeCount, isSuccess, isRecordSaved,
  } = useSudokuStore(
    useShallow((s) => ({
      difficulty: s.difficulty,
      gameMode: s.gameMode,
      currentTime: s.currentTime,
      hintsRemaining: s.hintsRemaining,
      mistakeCount: s.mistakeCount,
      isSuccess: s.isSuccess,
      isRecordSaved: s.isRecordSaved,
    })),
  );

  const save = useCallback(async (): Promise<
    string | null
  > => {
    if (savingRef.current) return null;
    if (!user || !isSuccess || isRecordSaved) return null;
    savingRef.current = true;

    const hintsUsed = HINTS_REMAINING - hintsRemaining;
    const result = calculatePoint({ difficulty, gameMode });
    setPointResult(result);

    const record: Omit<GameRecord, "id" | "createdAt"> = {
      userId: user.uid,
      userDisplayName: user.displayName || "익명",
      userPhotoURL: user.photoURL,
      gameMode,
      difficulty,
      completionTime: currentTime,
      hintsUsed,
      mistakesCount: mistakeCount,
      score: result.totalPoint,
      point: result.totalPoint,
      isSuccess: true,
    };

    setIsSaving(true);
    setError(null);

    try {
      const recordId = await saveGameRecord(record);
      useSudokuStore.setState({ isRecordSaved: true });
      return recordId;
    } catch (err) {
      savingRef.current = false;
      setError(
        err instanceof Error ? err : new Error("저장 실패"),
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [
    user, isSuccess, isRecordSaved, difficulty,
    gameMode, currentTime, hintsRemaining, mistakeCount,
  ]);

  return { save, isSaving, error, pointResult };
}
