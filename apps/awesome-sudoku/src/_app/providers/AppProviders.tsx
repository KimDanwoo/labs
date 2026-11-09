'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { JotaiProvider } from './JotaiProvider';
import { ThemeProvider } from './ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
