"use client";

import { setThemeAtom, themeAtom } from "@features/theme/model/atoms";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export function useThemeSync() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(setThemeAtom);

  useEffect(() => {
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system");

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, setTheme]);
}
