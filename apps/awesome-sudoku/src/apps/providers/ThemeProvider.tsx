'use client';

import { initThemeAtom } from '@features/theme/model/atoms';
import { useThemeSync } from '@features/theme/model/hooks';
import { useSetAtom } from 'jotai';
import { ReactNode, useEffect } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initTheme = useSetAtom(initThemeAtom);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useThemeSync();
  return <>{children}</>;
}
