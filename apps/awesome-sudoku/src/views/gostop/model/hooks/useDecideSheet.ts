import { useCallback, useMemo, useState } from 'react';

export interface DecideSheetControl {
  isDecideOpen: boolean;
  isDecideClosed: boolean;
  openDecide: () => void;
  closeDecide: () => void;
}

export const useDecideSheet = (isDeciding: boolean): DecideSheetControl => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasDeciding, setWasDeciding] = useState(isDeciding);

  if (wasDeciding !== isDeciding) {
    setWasDeciding(isDeciding);
    setIsDismissed(false);
  }

  const openDecide = useCallback(() => setIsDismissed(false), []);
  const closeDecide = useCallback(() => setIsDismissed(true), []);

  return useMemo(
    () => ({
      isDecideOpen: isDeciding && !isDismissed,
      isDecideClosed: isDeciding && isDismissed,
      openDecide,
      closeDecide,
    }),
    [isDeciding, isDismissed, openDecide, closeDecide],
  );
};
