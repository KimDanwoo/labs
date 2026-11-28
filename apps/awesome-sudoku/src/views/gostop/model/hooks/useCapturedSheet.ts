import { useCallback, useMemo, useState } from 'react';

export interface CapturedSheetControl {
  isCapturedOpen: boolean;
  openCaptured: () => void;
  closeCaptured: () => void;
}

export const useCapturedSheet = (isBlocked: boolean): CapturedSheetControl => {
  const [isRequested, setIsRequested] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(isBlocked);

  if (wasBlocked !== isBlocked) {
    setWasBlocked(isBlocked);
    if (isBlocked) setIsRequested(false);
  }

  const openCaptured = useCallback(() => setIsRequested(true), []);
  const closeCaptured = useCallback(() => setIsRequested(false), []);

  return useMemo(
    () => ({ isCapturedOpen: isRequested, openCaptured, closeCaptured }),
    [isRequested, openCaptured, closeCaptured],
  );
};
