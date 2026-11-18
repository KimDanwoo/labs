import { useTheme } from 'next-themes';
import { useCallback, useSyncExternalStore } from 'react';
import { THEME_TRANSITION_CLASS, THEME_TRANSITION_MS } from '../../../config/theme';

const subscribeNothing = () => () => {};

const playThemeTransition = () => {
  const root = document.documentElement;
  root.classList.add(THEME_TRANSITION_CLASS);
  setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), THEME_TRANSITION_MS);
};

export const useThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const isDark = isHydrated && resolvedTheme === 'dark';

  const handleToggle = useCallback(() => {
    playThemeTransition();
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return { isDark, handleToggle };
};
