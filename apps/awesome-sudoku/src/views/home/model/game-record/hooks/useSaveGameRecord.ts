import {
  HINTS_REMAINING,
  calculatePoint,
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  gameStore,
  hintsRemainingAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  mistakeCountAtom,
  saveGameRecord,
  solutionAtom,
  type GameRecord,
  type PointResult,
} from '@entities/game';
import { userAtom } from '@entities/session';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SaveGameRecordOptions {
  onSaved?: () => void;
}

interface SaveGameRecordResult {
  save: () => Promise<string | null>;
  isSaving: boolean;
  error: Error | null;
  pointResult: PointResult | null;
}

const gameKeyOf = (solution: number[][]) => solution.flat().join('');

export function useSaveGameRecord({ onSaved }: SaveGameRecordOptions = {}): SaveGameRecordResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pointResult, setPointResult] = useState<PointResult | null>(null);
  const savingGameKey = useRef<string | null>(null);

  const user = useAtomValue(userAtom);
  const difficulty = useAtomValue(difficultyAtom);
  const gameMode = useAtomValue(gameModeAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const hintsRemaining = useAtomValue(hintsRemainingAtom);
  const mistakeCount = useAtomValue(mistakeCountAtom);
  const isSuccess = useAtomValue(isSuccessAtom);
  const isRecordSaved = useAtomValue(isRecordSavedAtom);

  if (isSuccess && !pointResult) {
    setPointResult(
      calculatePoint({
        difficulty,
        gameMode,
        completionTime: currentTime,
      }),
    );
  }
  if (!isSuccess && pointResult) {
    setPointResult(null);
  }
  if (!isSuccess && error) {
    setError(null);
  }

  const save = useCallback(async (): Promise<string | null> => {
    const gameKey = gameKeyOf(gameStore.get(solutionAtom));
    if (savingGameKey.current === gameKey) return null;
    if (!user || !isSuccess || gameStore.get(isRecordSavedAtom)) return null;
    savingGameKey.current = gameKey;

    const hintsUsed = HINTS_REMAINING - hintsRemaining;
    const result =
      pointResult ??
      calculatePoint({
        difficulty,
        gameMode,
        completionTime: currentTime,
      });
    setPointResult(result);

    const record: Omit<GameRecord, 'id' | 'createdAt'> = {
      userId: user.uid,
      userDisplayName: user.displayName || '익명',
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
      if (gameKeyOf(gameStore.get(solutionAtom)) === gameKey) {
        gameStore.set(isRecordSavedAtom, true);
        onSaved?.();
      }
      return recordId;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('저장 실패'));
      return null;
    } finally {
      if (savingGameKey.current === gameKey) {
        savingGameKey.current = null;
        setIsSaving(false);
      }
    }
  }, [user, isSuccess, difficulty, gameMode, currentTime, hintsRemaining, mistakeCount, pointResult, onSaved]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (user && isSuccess && !isRecordSaved) {
      saveRef.current();
    }
  }, [user, isSuccess, isRecordSaved]);

  return { save, isSaving, error, pointResult };
}
