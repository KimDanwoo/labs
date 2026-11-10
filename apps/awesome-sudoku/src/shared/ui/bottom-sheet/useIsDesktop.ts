'use client';

import { useEffect, useState } from 'react';

const MD_BREAKPOINT = '(min-width: 768px)';

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MD_BREAKPOINT).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MD_BREAKPOINT);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}
