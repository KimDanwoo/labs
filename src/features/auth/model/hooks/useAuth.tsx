import { signInWithGoogle, signOut } from "@features/auth/model/services/authService";
import { useAuthStore } from "@features/auth/model/stores/authStore";
import { useCallback } from "react";

export function useAuth() {
  const { user, isLoading, isAuthenticated, logout } = useAuthStore();

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
export * from "./useAuth";
