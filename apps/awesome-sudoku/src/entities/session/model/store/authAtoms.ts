import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { User } from '../types/user';

export const userAtom = atomWithStorage<User | null>('sudoku-user', null);

export const isLoadingAtom = atom(true);

export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);

export const setUserAtom = atom(null, (_get, set, user: User | null) => {
  set(userAtom, user);
  set(isLoadingAtom, false);
});

export const setLoadingAtom = atom(null, (_get, set, loading: boolean) => {
  set(isLoadingAtom, loading);
});

export const logoutAtom = atom(null, (_get, set) => {
  set(userAtom, null);
  set(isLoadingAtom, false);
});
