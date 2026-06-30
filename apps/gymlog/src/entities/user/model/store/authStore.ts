import type { User } from 'firebase/auth';
import { atom } from 'jotai';

// 현재 로그인 사용자(비로그인 null). onAuthStateChanged가 갱신한다.
export const firebaseUserAtom = atom<User | null>(null);

// 첫 인증 상태 확인이 끝났는지 — true 전엔 로그인 여부를 단정하지 않는다(깜빡임 방지).
export const authReadyAtom = atom(false);
