'use client';

import { authReadyAtom } from '@entities/user/model/store';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { useAuthListener } from '../model/hooks';

type AuthBoundaryProps = {
  children: ReactNode;
};

// 인증 상태 구독만 켠다(로그인 강제 없음 — 비회원도 사용).
// 첫 인증 확인 전에는 로딩으로 가려, 로그인 여부가 정해진 뒤 데이터 소스를 결정하게 한다.
export function AuthBoundary({ children }: AuthBoundaryProps) {
  useAuthListener();
  const ready = useAtomValue(authReadyAtom);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-mobile items-center justify-center px-lg text-muted-foreground">
        불러오는 중…
      </main>
    );
  }

  return <>{children}</>;
}
