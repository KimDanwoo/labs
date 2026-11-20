import { useCallback, useState } from 'react';

interface Dismissible {
  isOpen: boolean;
  dismiss: () => void;
}

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
