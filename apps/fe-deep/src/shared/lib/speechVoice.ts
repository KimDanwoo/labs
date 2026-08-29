import { STORAGE_KEYS } from '@shared/constants';

export const getSynth = () => (typeof window === 'undefined' ? undefined : window.speechSynthesis);

const listeners = new Set<() => void>();

export function subscribePreferredVoice(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** 빈 문자열이면 자동 선택. */
export function getPreferredVoiceName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.SPEECH_VOICE) ?? '';
  } catch {
    // 사파리 프라이빗 모드 등 localStorage 접근이 막힌 환경
    return '';
  }
}

export function setPreferredVoiceName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SPEECH_VOICE, name);
  } catch {
    // 저장만 실패할 뿐, 이번 세션 선택은 그대로 반영한다
  }
  listeners.forEach((listener) => listener());
}
