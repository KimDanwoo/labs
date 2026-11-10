'use client';

import { useEffect } from 'react';

const HIDE_DELAY_MS = 700;

/** 스크롤 중에만 `<html>`에 `data-scrolling`을 붙인다. 실제 표시는 globals.css의 scrollbar-color가 담당. */
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
