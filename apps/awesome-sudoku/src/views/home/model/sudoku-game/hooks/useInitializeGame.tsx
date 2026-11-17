import { PERSISTED_GAME_ATOMS, resumeOrStartGameAtom } from '@entities/game';
import { useSetAtom, useStore } from 'jotai';
import { useEffect } from 'react';

export const useInitializeGame = () => {
  const store = useStore();
  const resumeOrStartGame = useSetAtom(resumeOrStartGameAtom);

  useEffect(() => {
    // jotai는 저장된 값을 atom이 구독될 때 읽는다. 화면이 구독하지 않는 정답까지 모두 읽어 온 뒤에 이어 할지 새로 시작할지 정한다
    // https://jotai.org/docs/utilities/storage#atomwithstorage
    const unsubscribes = PERSISTED_GAME_ATOMS.map((persistedAtom) => store.sub(persistedAtom, () => undefined));
    void resumeOrStartGame();

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [store, resumeOrStartGame]);
};
