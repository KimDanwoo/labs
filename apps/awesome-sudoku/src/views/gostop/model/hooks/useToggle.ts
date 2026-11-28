'use client';

import { useCallback, useMemo, useState } from 'react';

export interface ToggleControl {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useToggle = (): ToggleControl => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
};
