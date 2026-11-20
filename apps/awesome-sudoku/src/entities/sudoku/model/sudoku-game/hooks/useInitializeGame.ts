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
    // jotai는 저장된 값을 atom이 구독될 때 읽는다. 화면이 구독하지 않는 정답·쉬는 판까지 모두 읽어 온 뒤에 이어 할지 새로 시작할지 정한다
    // https://jotai.org/docs/utilities/storage#atomwithstorage
    const unsubscribes = STORED_ATOMS.map((storedAtom) => store.sub(storedAtom, () => undefined));
    void enterMode(mode);

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [store, enterMode, mode]);
};
