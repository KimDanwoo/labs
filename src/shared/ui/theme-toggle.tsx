'use client';

import { useTheme } from 'next-themes';
import { useState, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted] = useState(() => typeof window !== 'undefined');

  const isDark = theme === 'dark';

  const handleToggle = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  if (!mounted) return <div className="w-[52px] h-7" />;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="다크 모드 토글"
      onClick={handleToggle}
      className={cn(
        'group relative flex items-center shrink-0',
        'w-[52px] h-7 rounded-full p-[3px]',
        'hover:shadow-md active:scale-95',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring/40',
      )}
    >
      {/* Light track background */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-r from-sky-200 to-amber-200',
          'transition-opacity duration-500',
          isDark ? 'opacity-0' : 'opacity-100',
        )}
      />

      {/* Dark track background */}
      <div
        className={cn(
          'absolute inset-0 rounded-full',
          'bg-indigo-950',
          'transition-opacity duration-500',
          isDark
            ? 'opacity-100 shadow-inner shadow-indigo-900/50'
            : 'opacity-0',
        )}
      />

      {/* Stars overlay (dark mode only) */}
      <div
        className={cn(
          'absolute inset-0 rounded-full overflow-hidden',
          'transition-opacity duration-700',
          isDark ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span
          className="absolute rounded-full bg-white/70"
          style={{ width: 3, height: 3, top: 5, left: 10 }}
        />
        <span
          className="absolute rounded-full bg-white/40"
          style={{ width: 2, height: 2, top: 17, left: 17 }}
        />
        <span
          className="absolute rounded-full bg-white/50"
          style={{ width: 2, height: 2, top: 7, left: 24 }}
        />
      </div>

      {/* Sliding thumb */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center',
          'w-[22px] h-[22px] rounded-full shadow-md',
          'transition-all duration-500',
          'ease-[cubic-bezier(0.68,-0.15,0.27,1.15)]',
          isDark
            ? 'translate-x-[24px] bg-indigo-100'
            : 'translate-x-0 bg-white',
        )}
      >
        {/* Sun icon */}
        <Sun
          size={13}
          className={cn(
            'absolute text-amber-500',
            'transition-all duration-500',
            isDark
              ? 'opacity-0 -rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100',
          )}
        />
        {/* Moon icon */}
        <Moon
          size={13}
          className={cn(
            'absolute text-indigo-600',
            'transition-all duration-500',
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0',
          )}
        />
      </div>
    </button>
  );
}
