'use client';

import { useScrollToTopOnRouteChange } from '../model/hooks/useScrollToTopOnRouteChange';

export function ScrollToTop() {
  useScrollToTopOnRouteChange();
  return null;
}
