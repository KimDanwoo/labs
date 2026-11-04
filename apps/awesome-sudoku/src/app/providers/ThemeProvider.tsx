'use client';

import { useThemeSync } from '@entities/theme/model/hooks';
import { initThemeAtom } from '@entities/theme/model/store';
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
