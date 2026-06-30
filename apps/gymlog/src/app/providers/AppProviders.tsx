import { AuthBoundary, SignInConsent } from '@features/auth/ui';
import { DataBoundary } from '@features/cloud-sync/ui';
import { ForegroundMessages } from '@features/notifications/ui';
import { LeaderboardSync } from '@features/ranking/ui';
import { BottomNav } from '@widgets/bottom-nav/ui';
import { LevelUpCelebration } from '@widgets/level-card/ui';
import type { ReactNode } from 'react';

type AppProvidersProps = {
  children: ReactNode;
};

// 전역 프로바이더 합성 루트(FSD app 레이어).
// 인증 확인 → 소스(비회원=로컬/로그인=DB)에서 데이터 로드 → 화면. 레벨업 축하 오버레이는 전역.
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      <AuthBoundary>
        <DataBoundary>{children}</DataBoundary>
      </AuthBoundary>
      <BottomNav />
      <SignInConsent />
      <LeaderboardSync />
      <ForegroundMessages />
      <LevelUpCelebration />
    </>
  );
}
