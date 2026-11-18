'use client';

import type { ReactNode } from 'react';
import { JotaiProvider } from './JotaiProvider';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </JotaiProvider>
  );
}
