import { atom } from 'jotai';
import type { ModalType } from '@shared/types';

export const activeModalAtom = atom<ModalType>(null);

export const openModalAtom = atom(null, (_get, set, modal: ModalType) => {
  set(activeModalAtom, modal);
});

export const closeModalAtom = atom(null, (_get, set) => {
  set(activeModalAtom, null);
});
