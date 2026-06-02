'use client';

import { useEffect, useRef, useState } from 'react';

const HIDE_DELAY = 500;

export function ScrollHint() {
  const [isVisible, setIsVisible] = useState(true);
  const sentinelRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(([entry]) => {
      const isAtTop = entry.isIntersecting;

      if (isAtTop) {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        setIsVisible(true);
        return;
      }

      if (!hideTimer) {
        hideTimer = setTimeout(() => {
          setIsVisible(false);
          hideTimer = null;
        }, HIDE_DELAY);
      }
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <span
        ref={sentinelRef}
        aria-hidden="true"
        className="absolute top-0 left-0 h-px w-px"
      />
      <div
        aria-hidden="true"
        className={`fixed bottom-7 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/80 pt-2 drop-shadow-[0_1px_5px_rgba(0,0,0,0.5)]">
          <span className="animate-scroll-wheel h-2 w-1 rounded-full bg-primary-bright" />
        </span>
        <span className="text-xs font-medium tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          스크롤해보세요
        </span>
      </div>
    </>
  );
}
