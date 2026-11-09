'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { setThemeAtom, themeAtom } from '../store/themeAtoms';

export function useThemeSync() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(setThemeAtom);

  useEffect(() => {
    if (theme !== 'system') return undefined;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setTheme('system');

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme, setTheme]);
}
