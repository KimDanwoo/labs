'use client';

import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { useAuth } from './useAuth';
import { GOOGLE_AUTH_INTENT, googleAuthIntentAtom } from '../store';

/**
 * 구글 인증(로그인·연동) 전 약관 동의 게이트.
 * 컴포넌트는 requestLogin/requestLink 로 의도만 올리고,
 * 동의 모달의 agree 가 실제 OAuth 를 실행한다.
 */
export function useGoogleConsent() {
  const [intent, setIntent] = useAtom(googleAuthIntentAtom);
  const { signInWithGoogle, linkWithGoogle } = useAuth();

  const requestLogin = useCallback(
    () => setIntent(GOOGLE_AUTH_INTENT.LOGIN),
    [setIntent],
  );

  const requestLink = useCallback(
    () => setIntent(GOOGLE_AUTH_INTENT.LINK),
    [setIntent],
  );

  const cancel = useCallback(() => setIntent(null), [setIntent]);

  const agree = useCallback(async () => {
    const action =
      intent === GOOGLE_AUTH_INTENT.LINK ? linkWithGoogle : signInWithGoogle;
    setIntent(null);
    await action().catch(() => {});
  }, [intent, linkWithGoogle, signInWithGoogle, setIntent]);

  return { intent, requestLogin, requestLink, cancel, agree };
}
