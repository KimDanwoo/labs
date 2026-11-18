'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { JotaiProvider } from './JotaiProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider attribute="class" enableSystem>
        {children}
      </ThemeProvider>
    </JotaiProvider>
  );
}
