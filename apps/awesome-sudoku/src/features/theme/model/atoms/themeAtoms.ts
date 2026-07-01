import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type Theme = "light" | "dark" | "system";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (resolved: "light" | "dark") => {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", resolved === "dark");
  setTimeout(() => root.classList.remove("theme-transition"), 350);
};

/** 사용자가 선택한 테마 (localStorage 영속) */
export const themeAtom = atomWithStorage<Theme>("sudoku-theme", "system");

/** 실제 적용된 테마 (system일 때 resolve된 값) */
export const resolvedThemeAtom = atom<"light" | "dark">("light");

/** 테마 변경 액션 */
export const setThemeAtom = atom(
  null,
  (_get, set, theme: Theme) => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    set(themeAtom, theme);
    set(resolvedThemeAtom, resolved);
  },
);

/**
 * 초기 테마 resolve 액션.
 * ThemeProvider에서 마운트 시 호출하여 resolvedTheme을 동기화한다.
 */
export const initThemeAtom = atom(
  null,
  (get, set) => {
    const theme = get(themeAtom);
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    set(resolvedThemeAtom, resolved);
  },
);
