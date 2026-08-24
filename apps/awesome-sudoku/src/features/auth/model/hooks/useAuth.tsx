import { isAuthenticatedAtom, isLoadingAtom, logoutAtom, userAtom } from '@features/auth/model/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { signInWithGoogle, signOut } from '../services/authService';

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

// src/features/auth/model/hooks/index.ts
export * from './useAuth';
