import { atom } from 'jotai';

// 약관 동의 시트 열림 여부. 로그인 진입점(설정·온보딩)에서 열고, 동의 후 실제 로그인한다.
export const signInConsentOpenAtom = atom(false);
