import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type Theme = 'light' | 'dark' | 'system';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (resolved: 'light' | 'dark') => {
  const root = document.documentElement;
  root.classList.add('theme-transition');
  root.classList.toggle('dark', resolved === 'dark');
  setTimeout(() => root.classList.remove('theme-transition'), 350);
};

export const themeAtom = atomWithStorage<Theme>('sudoku-theme', 'system');

export const resolvedThemeAtom = atom<'light' | 'dark'>('light');

export const setThemeAtom = atom(null, (_get, set, theme: Theme) => {
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(resolved);
  set(themeAtom, theme);
  set(resolvedThemeAtom, resolved);
});

export const initThemeAtom = atom(null, (get, set) => {
  const theme = get(themeAtom);
  const resolved = theme === 'system' ? getSystemTheme() : theme;
  applyTheme(resolved);
  set(resolvedThemeAtom, resolved);
});
