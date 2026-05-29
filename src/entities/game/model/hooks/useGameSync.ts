'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { GameState } from '@shared/types';
import { INITIAL_GAME_STATE, ALL_CHARACTER_IDS } from '@shared/constants';
import { supabase } from '@shared/lib';
import { characterStatesAtom, isLoadedAtom } from '../store';

const STORAGE_KEY = 'plco-damagochi-saves';
const LEGACY_STORAGE_KEY = 'plco-damagochi-state';
const SYNC_DEBOUNCE_MS = 3000;

const VALID_CHARACTER_IDS = new Set<string>(ALL_CHARACTER_IDS);

function normalizeState(loaded: Partial<GameState>): GameState {
  return { ...INITIAL_GAME_STATE, ...loaded };
}

function parseLoaded(raw: unknown): Record<string, GameState> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.characterStates && typeof obj.characterStates === 'object') {
    const rawStates = obj.characterStates as Record<string, Partial<GameState>>;
    const characterStates: Record<string, GameState> = {};
    for (const [id, st] of Object.entries(rawStates)) {
      if (!VALID_CHARACTER_IDS.has(id)) continue;
      characterStates[id] = normalizeState(st ?? {});
    }
    return characterStates;
  }

  if (
    typeof obj.characterId === 'string' &&
    VALID_CHARACTER_IDS.has(obj.characterId)
  ) {
    const state = normalizeState(obj as Partial<GameState>);
    const id = state.characterId as string;
    return { [id]: state };
  }

  return null;
}

function maxLastUpdated(states: Record<string, GameState>): number {
  let max = 0;
  for (const st of Object.values(states)) {
    if (st.lastUpdated > max) max = st.lastUpdated;
  }
  return max;
}

function mergeStates(
  prev: Record<string, GameState>,
  incoming: Record<string, GameState>,
): Record<string, GameState> {
  const merged: Record<string, GameState> = { ...prev };
  for (const [id, incomingState] of Object.entries(incoming)) {
    const existing = merged[id];
    if (!existing || incomingState.lastUpdated > existing.lastUpdated) {
      merged[id] = incomingState;
    }
  }
  return merged;
}

export function useGameSync(userId: string | null) {
  const characterStates = useAtomValue(characterStatesAtom);
  const setCharacterStates = useSetAtom(characterStatesAtom);
  const isLoaded = useAtomValue(isLoadedAtom);
  const setIsLoaded = useSetAtom(isLoadedAtom);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const states = parseLoaded(JSON.parse(raw));
        if (states) {
          setCharacterStates((prev) => mergeStates(prev, states));
          if (!window.localStorage.getItem(STORAGE_KEY)) {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ characterStates: states }),
            );
            window.localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
        }
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, [setCharacterStates, setIsLoaded]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('game_saves')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data?.state) return;
      const states = parseLoaded(data.state);
      if (!states) return;
      setCharacterStates((prev) => mergeStates(prev, states));
    };
    load();
  }, [userId, setCharacterStates]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ characterStates }),
      );
    } catch {
      // ignore
    }
  }, [characterStates, isLoaded]);

  const saveToDb = useCallback(async () => {
    if (!userId) return;
    if (Object.keys(characterStates).length === 0) return;
    const lastUpdated = maxLastUpdated(characterStates) || Date.now();
    await supabase
      .from('game_saves')
      .upsert(
        {
          user_id: userId,
          state: { characterStates },
          last_updated: lastUpdated,
        },
        { onConflict: 'user_id' },
      );
  }, [userId, characterStates]);

  useEffect(() => {
    if (!userId || !isLoaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveToDb, SYNC_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId, isLoaded, saveToDb]);
}
