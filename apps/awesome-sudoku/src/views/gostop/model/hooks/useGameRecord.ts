'use client';

import { PHASE } from '@views/gostop/config/game';
import { STORAGE_KEY } from '@views/gostop/config/storage';
import { parseRecord, recordGame } from '@views/gostop/lib/record';
import { readStored } from '@views/gostop/lib/storage';
import { useStoredValue } from '@views/gostop/model/hooks/useStoredValue';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { GameRecord } from '@views/gostop/model/types/record';
import { useEffect } from 'react';

export const useGameRecord = (game: GameState, gameId: string | null, isSettled: boolean): GameRecord => {
  const [record, save] = useStoredValue(STORAGE_KEY.RECORD, parseRecord);
  const isOver = game.phase === PHASE.OVER;
  const result = isOver ? game.result : null;
  const shouldRecord = isSettled && Boolean(result) && Boolean(gameId);

  useEffect(() => {
    if (!shouldRecord) return;
    if (!result) return;
    if (!gameId) return;
    const stored = parseRecord(readStored(STORAGE_KEY.RECORD));
    const next = recordGame(stored, gameId, result);
    if (next !== stored) save(next);
  }, [shouldRecord, result, gameId, save]);

  return record;
};
