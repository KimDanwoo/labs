'use client';

import { LuMoon, LuSun } from 'react-icons/lu';

import { useThemeToggle } from '@app/model/hooks/useThemeToggle';

export function ThemeToggle() {
  const { isDark, handleToggle } = useThemeToggle();
  const ThemeIcon = isDark ? LuMoon : LuSun;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="다크 모드 토글"
      data-theme-toggle
      onClick={handleToggle}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
    >
      <ThemeIcon className="size-5" aria-hidden="true" />
    </button>
  );
}
