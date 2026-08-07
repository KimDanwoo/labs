import { initializeStageAtom, puzzleAtom } from '@features/stardoku-game/model/atoms';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useEffect } from 'react';

/**
 * 저장된 퍼즐이 없으면 현재 스테이지를 시작한다.
 * 판정은 effect 실행 시점에 atom을 직접 읽어서 한다 — 렌더 시점 값을 쓰면
 * atomWithStorage의 복원(구독 시 동기 수행)보다 앞선 null을 보고 저장된 판을 덮어쓴다.
 */
export const useInitializeStage = (): void => {
  const ensureStage = useAtomCallback(
    useCallback((get, set) => {
      if (!get(puzzleAtom)) set(initializeStageAtom);
    }, []),
  );

  useEffect(() => {
    ensureStage();
  }, [ensureStage]);
};
