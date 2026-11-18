import { useSyncExternalStore } from 'react';

import { applyTheme, readIsDark, readServerIsDark, subscribeTheme } from '../../lib/themeStore';

export function useTheme() {
  const isDark = useSyncExternalStore(subscribeTheme, readIsDark, readServerIsDark);
  const toggleTheme = () => applyTheme(!isDark);
  return { isDark, toggleTheme };
}
