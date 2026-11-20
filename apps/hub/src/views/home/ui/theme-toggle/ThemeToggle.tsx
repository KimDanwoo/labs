'use client';

import { cn } from '@shared/lib/cn';
import { Moon, Sun } from 'lucide-react';

import { THEME_ICON_SIZE } from '@views/home/config/theme';
import { useTheme } from '@views/home/model/hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="라이트/다크 모드 전환"
      onClick={toggleTheme}
      suppressHydrationWarning
      className="group relative flex h-7 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-shadow hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 rounded-full bg-linear-to-r from-toggle-day-start to-toggle-day-end transition-opacity duration-500',
          isDark ? 'opacity-0' : 'opacity-100',
        )}
      />
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 rounded-full bg-toggle-night transition-opacity duration-500',
          isDark ? 'shadow-toggle-night/50 opacity-100 shadow-inner' : 'opacity-0',
        )}
      />
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 overflow-hidden rounded-full transition-opacity duration-700',
          isDark ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="absolute top-[5px] left-[10px] size-[3px] rounded-full bg-white/70" />
        <span className="absolute top-[17px] left-[17px] size-[2px] rounded-full bg-white/40" />
        <span className="absolute top-[7px] left-[24px] size-[2px] rounded-full bg-white/50" />
      </span>
      <span
        suppressHydrationWarning
        className={cn(
          'relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full shadow-md transition-all duration-500 ease-[cubic-bezier(0.68,-0.15,0.27,1.15)]',
          isDark ? 'translate-x-[24px] bg-toggle-thumb-night' : 'translate-x-0 bg-toggle-thumb',
        )}
      >
        <Sun
          size={THEME_ICON_SIZE}
          className={cn(
            'absolute text-toggle-sun transition-all duration-500',
            isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
          )}
        />
        <Moon
          size={THEME_ICON_SIZE}
          className={cn(
            'absolute text-toggle-moon transition-all duration-500',
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0',
          )}
        />
      </span>
    </button>
  );
}
