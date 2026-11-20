'use client';

import { JotaiProvider } from '@app/providers/JotaiProvider';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider attribute="class" enableSystem>
        {children}
      </ThemeProvider>
    </JotaiProvider>
  );
}
