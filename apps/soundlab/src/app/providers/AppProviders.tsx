'use client';

import { Provider } from 'jotai';
import type { ReactNode } from 'react';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <Provider>{children}</Provider>;
}
