'use client';

import { cn } from '@shared/lib/cn';
import { Moon, Sun } from 'lucide-react';

import { THEME_ICON_SIZE } from '../../config/theme';
import { useTheme } from '../../model/hooks/useTheme';
import { styles } from './ThemeToggle.styles';

export function ThemeToggle() {
  const { isDark, theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="라이트/다크 모드 전환"
      onClick={toggleTheme}
      suppressHydrationWarning
      className={styles.root}
    >
      <span suppressHydrationWarning className={cn(styles.dayBackground.base, styles.dayBackground[theme])} />
      <span suppressHydrationWarning className={cn(styles.nightBackground.base, styles.nightBackground[theme])} />
      <span suppressHydrationWarning className={cn(styles.stars.base, styles.stars[theme])}>
        {styles.star.map((starClassName) => (
          <span key={starClassName} className={starClassName} />
        ))}
      </span>
      <span suppressHydrationWarning className={cn(styles.thumb.base, styles.thumb[theme])}>
        <Sun size={THEME_ICON_SIZE} className={cn(styles.sun.base, styles.sun[theme])} />
        <Moon size={THEME_ICON_SIZE} className={cn(styles.moon.base, styles.moon[theme])} />
      </span>
    </button>
  );
}
