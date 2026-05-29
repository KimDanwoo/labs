import { atom } from 'jotai';
import type { CharacterId, GameAction, GameState } from '@shared/types';
import { INITIAL_GAME_STATE } from '@shared/constants';
import { gameReducer } from '../reducer';

export const characterStatesAtom = atom<Record<string, GameState>>({});

export const activeCharacterIdAtom = atom<CharacterId | null>(null);

export const isLoadedAtom = atom(false);

export const gameAtom = atom<GameState, [GameAction], void>(
  (get) => {
    const id = get(activeCharacterIdAtom);
    if (!id) return INITIAL_GAME_STATE;
    const states = get(characterStatesAtom);
    return states[id] ?? INITIAL_GAME_STATE;
  },
  (get, set, action) => {
    if (action.type === 'SELECT_CHARACTER' || action.type === 'SWITCH_CHARACTER') {
      const targetId = action.characterId;
      const now = Date.now();
      set(characterStatesAtom, (prev) => {
        const existing = prev[targetId];
        if (existing) {
          const restored = gameReducer(existing, {
            type: 'PROCESS_OFFLINE',
            now,
          });
          return { ...prev, [targetId]: restored };
        }
        return {
          ...prev,
          [targetId]: gameReducer(INITIAL_GAME_STATE, {
            type: 'SELECT_CHARACTER',
            characterId: targetId,
            nickname: action.nickname,
          }),
        };
      });
      set(activeCharacterIdAtom, targetId);
      return;
    }

    const id = get(activeCharacterIdAtom);
    if (!id) return;

    set(characterStatesAtom, (prev) => {
      const current = prev[id] ?? INITIAL_GAME_STATE;
      const next = gameReducer(current, action);
      if (next === current) return prev;
      return { ...prev, [id]: next };
    });
  },
);
