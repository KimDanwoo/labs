'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { GameState } from '@shared/types';
import { INITIAL_GAME_STATE } from '@shared/constants';
import { supabase } from '@shared/lib';
import { gameAtom, isLoadedAtom } from '../store';

const STORAGE_KEY = 'plave-damagochi-state';
const SYNC_DEBOUNCE_MS = 3000;

function normalize(loaded: Partial<GameState>): GameState {
  return { ...INITIAL_GAME_STATE, ...loaded };
}

export function useGameSync(userId: string | null) {
  const state = useAtomValue(gameAtom);
  const dispatch = useSetAtom(gameAtom);
  const isLoaded = useAtomValue(isLoadedAtom);
  const setIsLoaded = useSetAtom(isLoadedAtom);
  const stateRef = useRef(state);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // localStorage: 즉시 첫 페인트용 캐시
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GameState>;
        dispatch({ type: 'LOAD_STATE', state: normalize(parsed) });
        dispatch({ type: 'PROCESS_OFFLINE', now: Date.now() });
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, [dispatch, setIsLoaded]);

  // 서버: 더 최신일 때만 덮어쓰기 (오프라인 진행 보존)
  useEffect(() => {
    if (!userId) return;
    const loadSave = async () => {
      const { data, error } = await supabase
        .from('game_saves')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data?.state) return;

      const serverState = normalize(data.state as Partial<GameState>);
      const localLastUpdated = stateRef.current.lastUpdated;
      if (serverState.lastUpdated <= localLastUpdated) return;

      dispatch({ type: 'LOAD_STATE', state: serverState });
      dispatch({ type: 'PROCESS_OFFLINE', now: Date.now() });
    };
    loadSave();
  }, [userId, dispatch]);

  const saveToDb = useCallback(async () => {
    if (!userId || state.status === 'selecting') return;
    await supabase
      .from('game_saves')
      .upsert(
        {
          user_id: userId,
          state,
          last_updated: state.lastUpdated,
        },
        { onConflict: 'user_id' },
      );
  }, [userId, state]);

  // localStorage 즉시 저장
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, isLoaded]);

  // 서버 debounce 저장
  useEffect(() => {
    if (!userId || state.status === 'selecting') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveToDb, SYNC_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, state, saveToDb]);
}
