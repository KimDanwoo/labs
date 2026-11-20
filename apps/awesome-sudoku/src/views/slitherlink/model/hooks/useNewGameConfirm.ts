import type { SlitherlinkLevel } from '@views/slitherlink/model/types/slitherlink';
import { useCallback, useMemo, useState } from 'react';

export interface NewGameConfirm {
  isOpen: boolean;
  level: SlitherlinkLevel;
  request: (level: SlitherlinkLevel) => void;
  accept: () => void;
  dismiss: () => void;
}

export const useNewGameConfirm = (
  isInProgress: boolean,
  currentLevel: SlitherlinkLevel,
  startGame: (level: SlitherlinkLevel) => void,
): NewGameConfirm => {
  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState(currentLevel);

  const request = useCallback(
    (target: SlitherlinkLevel) => {
      if (!isInProgress) {
        startGame(target);
        return;
      }
      setLevel(target);
      setIsOpen(true);
    },
    [isInProgress, startGame],
  );

  const accept = useCallback(() => {
    setIsOpen(false);
    startGame(level);
  }, [level, startGame]);

  const dismiss = useCallback(() => setIsOpen(false), []);

  return useMemo(() => ({ isOpen, level, request, accept, dismiss }), [isOpen, level, request, accept, dismiss]);
};
