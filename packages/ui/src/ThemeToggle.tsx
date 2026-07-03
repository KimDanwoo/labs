'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { cn } from './lib/cn';

const THEME_CHANGE_EVENT = 'danwoo:themechange';

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return false;
}

/**
 * 라이트/다크 토글 — 전 앱 공용. 프레임워크 무관: `document.documentElement`의 `dark` 클래스와
 * `localStorage 'theme'`를 직접 다루고 커스텀 이벤트로 동기화한다(hub·gymlog·design의 init 스크립트와
 * 동일 계약, fe-deep의 next-themes(class+theme)와도 호환).
 */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="라이트/다크 모드 전환"
      onClick={toggle}
      suppressHydrationWarning
      className={cn(
        'group relative flex h-7 w-[52px] shrink-0 items-center rounded-full p-[3px]',
        'transition-shadow hover:shadow-md active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
    >
      {/* 라이트 트랙 */}
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-r from-toggle-day-start to-toggle-day-end transition-opacity duration-500',
          isDark ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* 다크 트랙 */}
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 rounded-full bg-toggle-night transition-opacity duration-500',
          isDark ? 'shadow-toggle-night/50 opacity-100 shadow-inner' : 'opacity-0',
        )}
      />
      {/* 별 오버레이 (다크) */}
      <span
        suppressHydrationWarning
        className={cn(
          'absolute inset-0 overflow-hidden rounded-full transition-opacity duration-700',
          isDark ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="absolute rounded-full bg-white/70" style={{ width: 3, height: 3, top: 5, left: 10 }} />
        <span className="absolute rounded-full bg-white/40" style={{ width: 2, height: 2, top: 17, left: 17 }} />
        <span className="absolute rounded-full bg-white/50" style={{ width: 2, height: 2, top: 7, left: 24 }} />
      </span>
      {/* 슬라이딩 썸 */}
      <span
        suppressHydrationWarning
        className={cn(
          'relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full shadow-md',
          'transition-all duration-500 ease-[cubic-bezier(0.68,-0.15,0.27,1.15)]',
          isDark ? 'translate-x-[24px] bg-toggle-thumb-night' : 'translate-x-0 bg-toggle-thumb',
        )}
      >
        <Sun
          size={13}
          className={cn(
            'absolute text-toggle-sun transition-all duration-500',
            isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
          )}
        />
        <Moon
          size={13}
          className={cn(
            'absolute text-toggle-moon transition-all duration-500',
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0',
          )}
        />
      </span>
    </button>
  );
}
