'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import type { UserProfile } from '@entities/profile/model/types';
import { signInConsentOpenAtom } from '@features/auth/model/store';
import { OnboardingFlow } from '@features/profile-setup/ui';
import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';

export function OnboardingView() {
  const router = useRouter();
  const [, setProfile] = useAtom(userProfileAtom);
  const setConsentOpen = useSetAtom(signInConsentOpenAtom);

  const handleComplete = (profile: UserProfile) => {
    setProfile(profile);
    // 직접 만들기를 고르면 바로 주간 플랜 편집(요일별·부위별)으로 안내.
    router.replace(profile.split === 'custom' ? '/plan' : '/');
  };

  // 기존 회원: 약관 동의 시트 → 로그인하면 DB에서 프로필을 불러와 온보딩을 건너뛴다.
  const handleSignIn = () => setConsentOpen(true);

  return (
    <main className="mx-auto w-full max-w-content px-lg">
      <OnboardingFlow onComplete={handleComplete} onSignIn={handleSignIn} />
    </main>
  );
}
