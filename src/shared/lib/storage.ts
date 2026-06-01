export function readLocalInt(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function writeLocalInt(key: string, value: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, String(value));
}
