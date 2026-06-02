'use client';

import { useEffect, useState } from 'react';

const HIDE_SCROLL_THRESHOLD = 40;

export function ScrollHint() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < HIDE_SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`fixed bottom-7 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <span className="text-xs font-medium tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
        아래로 내려보세요
      </span>
      <span className="animate-scroll-hint flex h-9 w-9 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg shadow-black/25 backdrop-blur-sm">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
