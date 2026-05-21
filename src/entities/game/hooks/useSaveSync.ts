'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GameState } from '@shared/types';
import { supabase } from '@shared/lib';
import { INITIAL_GAME_STATE } from '@shared/constants';

const SYNC_DEBOUNCE_MS = 3000;

function gameStateToRow(state: GameState) {
  return {
    character_id: state.characterId ?? '',
    nickname: state.nickname,
    status: state.status,
    level: state.level,
    exp: state.exp,
    hunger: state.hunger,
    cleanliness: state.cleanliness,
    hearts: state.hearts,
    coins: state.coins,
    poops: state.poops,
    inventory: state.inventory,
    pending_poops: state.pendingPoops ?? [],
    is_sleeping: state.isSleeping,
    is_sick: state.isSick,
    sick_since: state.sickSince,
    hunger_zero_since: state.hungerZeroSince,
    cleanliness_zero_since: state.cleanlinessZeroSince,
    unlocked_characters: state.unlockedCharacters ?? [],
    egg_ready_character_id: state.eggReadyCharacterId,
    level_up_message: state.levelUpMessage,
    last_updated: state.lastUpdated,
  };
}

function rowToGameState(row: Record<string, unknown>): GameState {
  return {
    ...INITIAL_GAME_STATE,
    characterId: (row.character_id as GameState['characterId']) || null,
    nickname: (row.nickname as string) ?? '',
    status: (row.status as GameState['status']) ?? 'selecting',
    level: (row.level as number) ?? 1,
    exp: (row.exp as number) ?? 0,
    hunger: (row.hunger as number) ?? 80,
    cleanliness: (row.cleanliness as number) ?? 100,
    hearts: (row.hearts as number) ?? 0,
    coins: (row.coins as number) ?? 50,
    poops: (row.poops as GameState['poops']) ?? [],
    inventory: (row.inventory as GameState['inventory']) ?? INITIAL_GAME_STATE.inventory,
    pendingPoops: (row.pending_poops as number[]) ?? [],
    isSleeping: (row.is_sleeping as boolean) ?? false,
    isSick: (row.is_sick as boolean) ?? false,
    sickSince: (row.sick_since as number) ?? null,
    hungerZeroSince: (row.hunger_zero_since as number) ?? null,
    cleanlinessZeroSince: (row.cleanliness_zero_since as number) ?? null,
    unlockedCharacters: (row.unlocked_characters as GameState['unlockedCharacters']) ?? [],
    eggReadyCharacterId: (row.egg_ready_character_id as GameState['eggReadyCharacterId']) ?? null,
    levelUpMessage: (row.level_up_message as string) ?? null,
    lastUpdated: (row.last_updated as number) ?? Date.now(),
  };
}

export function useSaveSync(
  userId: string | null,
  state: GameState,
  dispatch: React.Dispatch<{ type: 'LOAD_STATE'; state: GameState }>,
) {
  const lastSyncRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 로드: DB에서 세이브 가져오기
  useEffect(() => {
    if (!userId) return;

    const loadSave = async () => {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return;

      const loaded = rowToGameState(data);
      dispatch({ type: 'LOAD_STATE', state: loaded });
    };

    loadSave();
  }, [userId, dispatch]);

  // 상태 변경 시 DB에 저장 (debounce)
  const saveToDb = useCallback(async () => {
    if (!userId || state.status === 'selecting') return;

    const row = gameStateToRow(state);

    await supabase
      .from('game_saves')
      .upsert(
        { user_id: userId, ...row },
        { onConflict: 'user_id' },
      );
  }, [userId, state]);

  useEffect(() => {
    if (!userId || state.status === 'selecting') return;

    // localStorage에도 백업 (오프라인 대비)
    try {
      window.localStorage.setItem('plave-damagochi-state', JSON.stringify(state));
    } catch {
      // 무시
    }

    // DB 동기화 debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveToDb();
      lastSyncRef.current = Date.now();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, state, saveToDb]);
}
