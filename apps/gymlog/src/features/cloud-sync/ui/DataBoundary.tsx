'use client';

import { firebaseUserAtom } from '@entities/user/model/store';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';
import { useDataPersistence, useSharedRoutines } from '../model/hooks';

type DataBoundaryProps = {
  children: ReactNode;
};

// 로그인 상태에 맞는 소스(비회원=localStorage / 로그인=Firestore)에서 데이터를 로드하고,
// 초기 로드가 끝나기 전에는 로딩 화면으로 가린다(빈 기본값 깜빡임 방지).
export function DataBoundary({ children }: DataBoundaryProps) {
  const user = useAtomValue(firebaseUserAtom);
  const loaded = useDataPersistence(user?.uid ?? null);
  useSharedRoutines();

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-mobile items-center justify-center px-lg text-muted-foreground">
        불러오는 중…
      </main>
    );
  }

  return <>{children}</>;
}
