'use client';

import { initThemeAtom, useThemeSync } from '@entities/theme';
import { useSetAtom } from 'jotai';
import { type ReactNode, useEffect } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initTheme = useSetAtom(initThemeAtom);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useThemeSync();
  return <>{children}</>;
}
