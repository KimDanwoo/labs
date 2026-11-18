import { THEME, THEME_CHANGE_EVENT, THEME_STORAGE_KEY } from '../config/theme';

export function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function readIsDark() {
  return document.documentElement.classList.contains(THEME.dark);
}

export function readServerIsDark() {
  return false;
}

export function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle(THEME.dark, isDark);
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? THEME.dark : THEME.light);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
