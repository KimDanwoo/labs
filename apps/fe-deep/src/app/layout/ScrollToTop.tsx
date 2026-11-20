'use client';

import { useScrollToTopOnRouteChange } from '@app/model/hooks/useScrollToTopOnRouteChange';

export function ScrollToTop() {
  useScrollToTopOnRouteChange();
  return null;
}
