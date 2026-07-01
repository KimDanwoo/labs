import { atom } from 'jotai';
import type { ModalType } from '@shared/types';

export const activeModalAtom = atom<ModalType>(null);
