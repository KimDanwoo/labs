import { GAME_STORAGE_KEY, GAME_STORAGE_LEGACY_KEY } from '@shared/constants';

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

/** 회원 탈퇴 시 디바이스에 남은 게임 세이브를 지운다(재로그인 시 재업로드 방지). */
export function clearLocalGameSaves(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GAME_STORAGE_KEY);
  window.localStorage.removeItem(GAME_STORAGE_LEGACY_KEY);
}
