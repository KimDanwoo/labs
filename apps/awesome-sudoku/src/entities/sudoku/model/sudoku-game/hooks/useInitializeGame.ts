import { enterModeAtom } from '@entities/sudoku/model/store/modeAtoms';
import { parkedGamesAtom } from '@entities/sudoku/model/store/parkedGameAtoms';
import { PERSISTED_GAME_ATOMS } from '@entities/sudoku/model/store/primitives';
import type { GameMode } from '@entities/sudoku/model/types/game';
import { useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';

const STORED_ATOMS = [...PERSISTED_GAME_ATOMS, parkedGamesAtom];

export const useInitializeGame = (mode: GameMode) => {
  const store = useStore();
  const enterMode = useSetAtom(enterModeAtom);

  useEffect(() => {
    const storageReadSubscriptions = STORED_ATOMS.map((storedAtom) => store.sub(storedAtom, () => undefined));
    void enterMode(mode);

    return () => storageReadSubscriptions.forEach((unsubscribe) => unsubscribe());
  }, [store, enterMode, mode]);
};
