'use client';

import { type SVGProps, useSyncExternalStore } from 'react';

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

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

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
      data-dark={isDark}
      className="relative inline-flex h-7 w-[52px] shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[dark=true]:border-primary data-[dark=true]:bg-primary data-[dark=false]:border-card-border data-[dark=false]:bg-card"
    >
      <span
        suppressHydrationWarning
        data-dark={isDark}
        className="absolute top-0.5 left-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform duration-300 ease-out data-[dark=true]:translate-x-6 data-[dark=false]:translate-x-0"
      >
        <span className="relative h-3.5 w-3.5">
          <SunIcon
            suppressHydrationWarning
            data-dark={isDark}
            className="absolute inset-0 h-full w-full transition-all duration-300 data-[dark=true]:scale-50 data-[dark=true]:rotate-90 data-[dark=true]:opacity-0 data-[dark=false]:scale-100 data-[dark=false]:rotate-0 data-[dark=false]:opacity-100"
          />
          <MoonIcon
            suppressHydrationWarning
            data-dark={isDark}
            className="absolute inset-0 h-full w-full transition-all duration-300 data-[dark=true]:scale-100 data-[dark=true]:rotate-0 data-[dark=true]:opacity-100 data-[dark=false]:-rotate-90 data-[dark=false]:scale-50 data-[dark=false]:opacity-0"
          />
        </span>
      </span>
    </button>
  );
}
