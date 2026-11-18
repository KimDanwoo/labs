import { STORAGE_KEYS } from '@shared/config/storageKeys';

export const getSynth = () => (typeof window === 'undefined' ? undefined : window.speechSynthesis);

export function getPreferredVoiceName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SPEECH_VOICE) ?? '';
  } catch {
    // 사파리 프라이빗 모드 등 localStorage 접근이 막힌 환경
    return '';
  }
}
