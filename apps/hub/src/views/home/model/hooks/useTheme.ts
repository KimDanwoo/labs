import { useSyncExternalStore } from 'react';

import { THEME } from '../../config/theme';
import { applyTheme, readIsDark, readServerIsDark, subscribeTheme } from '../../lib/themeStore';

export function useTheme() {
  const isDark = useSyncExternalStore(subscribeTheme, readIsDark, readServerIsDark);
  const theme = isDark ? THEME.dark : THEME.light;
  const toggleTheme = () => applyTheme(!isDark);
  return { isDark, theme, toggleTheme };
}
