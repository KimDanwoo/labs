"use client";

import { setLoadingAtom, setUserAtom } from "@features/auth/model/atoms";
import { subscribeToAuthChanges } from "@features/auth/model/services";
import { useSetAtom } from "jotai";
import { ReactNode, useEffect } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useSetAtom(setUserAtom);
  const setLoading = useSetAtom(setLoadingAtom);

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
