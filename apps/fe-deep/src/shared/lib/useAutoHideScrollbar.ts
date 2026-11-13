'use client';

import { useEffect } from 'react';

const HIDE_DELAY_MS = 700;

export function useAutoHideScrollbar() {
  useEffect(() => {
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      root.dataset.scrolling = '';
      clearTimeout(timer);
      timer = setTimeout(() => delete root.dataset.scrolling, HIDE_DELAY_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
      delete root.dataset.scrolling;
    };
  }, []);
}
