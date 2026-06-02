import { atom } from 'jotai';

export const GOOGLE_AUTH_INTENT = {
  LOGIN: 'login',
  LINK: 'link',
} as const;

export type GoogleAuthIntent =
  (typeof GOOGLE_AUTH_INTENT)[keyof typeof GOOGLE_AUTH_INTENT];

/** 약관 동의를 기다리는 구글 인증 의도. null 이면 동의 모달이 닫힌 상태. */
export const googleAuthIntentAtom = atom<GoogleAuthIntent | null>(null);
