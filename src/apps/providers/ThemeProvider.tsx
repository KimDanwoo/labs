"use client";

import { useThemeSync } from "@features/theme/model/hooks/useThemeSync";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useThemeSync();
  return <>{children}</>;
}
