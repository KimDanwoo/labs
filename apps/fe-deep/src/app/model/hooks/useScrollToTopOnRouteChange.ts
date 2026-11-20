import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const OVERRIDE_HTML_SMOOTH_SCROLL: ScrollBehavior = 'instant';

export function useScrollToTopOnRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: OVERRIDE_HTML_SMOOTH_SCROLL });
  }, [pathname, searchParams]);
}
