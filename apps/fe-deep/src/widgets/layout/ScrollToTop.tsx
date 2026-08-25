'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 라우트(경로·쿼리) 변경 시 창을 최상단으로 되돌린다.
 * html의 scroll-behavior: smooth가 Next 기본 스크롤 복원과 어긋나는 경우가 있어 instant로 강제한다.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, searchParams]);

  return null;
}
