"use client";

import { useThemeSync } from "@features/theme/model/hooks";
import { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useThemeSync();
  return <>{children}</>;
}
