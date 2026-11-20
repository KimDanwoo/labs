'use client';

import { makeQueryClient } from '@shared/config/queryClient';
import { useAutoHideScrollbar } from '@shared/lib/useAutoHideScrollbar';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

import { THEME } from '@app/config/theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(makeQueryClient);

  useAutoHideScrollbar();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme={THEME.dark} enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
