import type { ReactNode } from 'react';

type AppProvidersProps = {
  children: ReactNode;
};

// 전역 프로바이더 합성 루트(FSD app 레이어). React Query·Jotai 등 전역 컨텍스트는 여기에 모은다.
export function AppProviders({ children }: AppProvidersProps) {
  return <>{children}</>;
}
