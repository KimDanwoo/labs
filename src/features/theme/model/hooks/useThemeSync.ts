"use client";

import { useEffect } from "react";
import { useThemeStore } from "../stores/themeStore";

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme("system");

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, setTheme]);
}
