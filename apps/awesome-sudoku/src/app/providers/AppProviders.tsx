'use client';

import { makeQueryClient } from '@app/config/queryClient';
import { JotaiProvider } from '@app/providers/JotaiProvider';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ThemeProvider attribute="class" enableSystem>
          {children}
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
