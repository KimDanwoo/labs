import { useCallback, useState } from 'react';

interface Dismissible {
  /** 시트에 그대로 넘길 열림 여부 — 사용자가 닫았으면 false */
  isOpen: boolean;
  /** 시트의 onClose에 연결 */
  dismiss: () => void;
}

/**
 * "조건이 참인 동안 열리되, 사용자가 한 번 닫으면 그 회차에는 다시 안 뜨는" 시트용 상태.
 * 조건이 거짓으로 떨어지면(= 새 판이 시작되면) 닫힘 표시가 풀려 다음 회차에 다시 열린다.
 *
 * 리셋을 effect가 아니라 렌더 중 상태 보정으로 하는 게 핵심이다 —
 * effect로 미루면 조건이 참으로 돌아온 첫 렌더에 닫힘 표시가 남아 시트를 한 번 삼킨다.
 */
export const useDismissible = (shouldOpen: boolean): Dismissible => {
  const [dismissed, setDismissed] = useState(false);

  const [prevShouldOpen, setPrevShouldOpen] = useState(shouldOpen);
  if (prevShouldOpen !== shouldOpen) {
    setPrevShouldOpen(shouldOpen);
    if (!shouldOpen) setDismissed(false);
  }

  return {
    isOpen: shouldOpen && !dismissed,
    dismiss: useCallback(() => setDismissed(true), []),
  };
};
