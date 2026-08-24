import type { ModalType } from '@shared/types';
import { atom } from 'jotai';

export const activeModalAtom = atom<ModalType>(null);
