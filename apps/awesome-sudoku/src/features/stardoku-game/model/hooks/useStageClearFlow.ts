import { CLEAR_CELEBRATION_MS } from '@entities/stardoku/model/constants';
import { hintsRemainingAtom, isClearedAtom, nextStageAtom, stageAtom } from '@features/stardoku-game/model/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

interface StageClearFlow {
  /** 클리어 알림 문구 — 자동 진행 후에도 잠시 남는다 */
  toast: string | null;
  hideToast: () => void;
}

/**
 * 클리어 시 보드 연출이 끝나면 다음 스테이지로 자동 진행한다.
 * 매 판 모달을 닫는 클릭을 없애 리듬을 유지하고, 완성된 판을 볼 시간을 준다.
 */
export const useStageClearFlow = (): StageClearFlow => {
  const isCleared = useAtomValue(isClearedAtom);
  const stage = useAtomValue(stageAtom);
  const earnedPoints = useAtomValue(hintsRemainingAtom);
  const nextStage = useSetAtom(nextStageAtom);
  const [toast, setToast] = useState<string | null>(null);

  // 클리어로 전환되는 순간의 스테이지·점수를 렌더 중에 붙잡는다 — 자동 진행 후엔 값이 바뀐다
  const [prevCleared, setPrevCleared] = useState(isCleared);
  if (prevCleared !== isCleared) {
    setPrevCleared(isCleared);
    if (isCleared) setToast(`STAGE ${stage} 클리어 · +${earnedPoints}점`);
  }

  useEffect(() => {
    if (!isCleared) return undefined;
    const timer = setTimeout(() => nextStage(), CLEAR_CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [isCleared, nextStage]);

  return { toast, hideToast: useCallback(() => setToast(null), []) };
};
