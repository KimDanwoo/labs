"use client";

import { subscribeToAuthChanges } from "@features/auth/model/services/authService";
import { useAuthStore } from "@features/auth/model/stores/authStore";
import { AuthGuard } from "@features/auth/ui";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <AuthGuard>{children}</AuthGuard>;
}
