import { User } from "@entities/auth/model/types";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/** 로그인 사용자 (localStorage 영속) */
export const userAtom = atomWithStorage<User | null>("sudoku-user", null);

/** 인증 로딩 상태 */
export const isLoadingAtom = atom(true);

/** 로그인 여부 (derived — userAtom에서 자동 파생) */
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

/** 사용자 설정 액션 */
export const setUserAtom = atom(
  null,
  (_get, set, user: User | null) => {
    set(userAtom, user);
    set(isLoadingAtom, false);
  },
);

/** 로딩 상태 설정 액션 */
export const setLoadingAtom = atom(
  null,
  (_get, set, loading: boolean) => {
    set(isLoadingAtom, loading);
  },
);

/** 로그아웃 액션 */
export const logoutAtom = atom(
  null,
  (_get, set) => {
    set(userAtom, null);
    set(isLoadingAtom, false);
  },
);
