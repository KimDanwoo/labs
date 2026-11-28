'use client';

import { useEffect, useRef, type RefObject } from 'react';

export const useFocusOnMount = <T extends HTMLElement>(): RefObject<T | null> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return ref;
};
