import { GameRecord, PointResult } from '@entities/game-record/model/types';
import { HINTS_REMAINING } from '@entities/game/model/constants';
import { userAtom } from '@features/auth/model/atoms';
import { saveGameRecord } from '@features/game-record/model/services/gameRecordService';
import { calculatePoint } from '@features/game-record/model/utils/scoreCalculator';
import {
  currentTimeAtom,
  difficultyAtom,
  gameModeAtom,
  hintsRemainingAtom,
  isRecordSavedAtom,
  isSuccessAtom,
  mistakeCountAtom,
} from '@features/sudoku-game/model/atoms';
import { gameStore } from '@shared/model/store';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SaveGameRecordResult {
  save: () => Promise<string | null>;
  isSaving: boolean;
  error: Error | null;
  pointResult: PointResult | null;
}

/**
 * 게임 기록 저장 훅.
 * 비로그인 상태에서도 pointResult를 계산해 UI에 보여주고,
 * 로그인 완료 시 자동으로 Firestore에 저장한다.
 */
export function useSaveGameRecord(): SaveGameRecordResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pointResult, setPointResult] = useState<PointResult | null>(null);
  const savingRef = useRef(false);

  const user = useAtomValue(userAtom);
  const difficulty = useAtomValue(difficultyAtom);
  const gameMode = useAtomValue(gameModeAtom);
  const currentTime = useAtomValue(currentTimeAtom);
  const hintsRemaining = useAtomValue(hintsRemainingAtom);
  const mistakeCount = useAtomValue(mistakeCountAtom);
  const isSuccess = useAtomValue(isSuccessAtom);
  const isRecordSaved = useAtomValue(isRecordSavedAtom);

  // 게임 성공 시 pointResult를 미리 계산 (비로그인도) — 렌더 중 상태 보정
  if (isSuccess && !pointResult) {
    setPointResult(
      calculatePoint({
        difficulty,
        gameMode,
        completionTime: currentTime,
      }),
    );
  }

  const save = useCallback(async (): Promise<string | null> => {
    if (savingRef.current) return null;
    if (!user || !isSuccess || isRecordSaved) return null;
    savingRef.current = true;

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
      gameStore.set(isRecordSavedAtom, true);
      return recordId;
    } catch (err) {
      savingRef.current = false;
      setError(err instanceof Error ? err : new Error('저장 실패'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, isSuccess, isRecordSaved, difficulty, gameMode, currentTime, hintsRemaining, mistakeCount, pointResult]);

  // 로그인 후 자동 저장: user가 null→유저로 바뀌었을 때
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
