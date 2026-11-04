import { signInWithGoogle, signOut } from '@entities/session/model/services';
import { isAuthenticatedAtom, isLoadingAtom, logoutAtom, userAtom } from '@entities/session/model/store';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export function useAuth() {
  const user = useAtomValue(userAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const logout = useSetAtom(logoutAtom);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      throw new Error(error as string);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      logout();
    } catch (error) {
      throw new Error(error as string);
    }
  }, [logout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
  };
}
