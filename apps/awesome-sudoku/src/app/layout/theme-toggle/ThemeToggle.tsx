'use client';

import { LuMoon, LuSun } from 'react-icons/lu';

import { useThemeToggle } from '@app/model/hooks/useThemeToggle';
import { CircleButton } from '@shared/ui/circle-button';

export function ThemeToggle() {
  const { isDark, handleToggle } = useThemeToggle();
  const ThemeIcon = isDark ? LuSun : LuMoon;

  return (
    <CircleButton
      role="switch"
      aria-checked={isDark}
      aria-label="다크 모드 토글"
      data-theme-toggle
      onClick={handleToggle}
    >
      <ThemeIcon aria-hidden="true" className="animate-spin-in" />
    </CircleButton>
  );
}
