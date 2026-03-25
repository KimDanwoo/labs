"use client";

import { subscribeToAuthChanges } from "@features/auth/model/services";
import { useAuthStore } from "@features/auth/model/stores";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    subscribeToAuthChanges((user) => {
      setUser(user);
    }).then((unsub) => {
      if (cancelled) {
        unsub();
      } else {
        unsubscribe = unsub;
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setUser, setLoading]);

  return <>{children}</>;
}
