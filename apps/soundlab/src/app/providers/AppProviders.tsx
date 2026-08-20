'use client';

import { Provider } from 'jotai';
import type { ReactNode } from 'react';

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * 전역 프로바이더 합성 루트(FSD app 레이어). React Query 등 전역 컨텍스트는 여기에 모은다.
 *
 * jotai `Provider`는 store를 React 컨텍스트로 내린다. 없으면 모듈 싱글턴인 기본 store를 쓰는데,
 * 그건 서버 프로세스에서 모든 요청이 한 store를 공유한다는 뜻이다. 지금은 전 페이지가
 * 정적 프리렌더라 새지 않지만, 상태를 서버에서 읽는 순간 조용히 요청 간에 섞인다.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <Provider>{children}</Provider>;
}
