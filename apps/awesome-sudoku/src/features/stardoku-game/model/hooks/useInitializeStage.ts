import { initializeStageAtom, puzzleAtom } from '@features/stardoku-game/model/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

/** 저장된 퍼즐이 없으면 현재 스테이지를 시작한다 */
export const useInitializeStage = (): void => {
  const puzzle = useAtomValue(puzzleAtom);
  const initializeStage = useSetAtom(initializeStageAtom);

  useEffect(() => {
    if (!puzzle) initializeStage();
  }, [puzzle, initializeStage]);
};
