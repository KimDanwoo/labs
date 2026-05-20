import { atom } from 'jotai';

import { calculateDestiny } from '../lib/calculateDestiny';

import type { DestinyFormData } from './types';

type InputFormState = {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  shichen: string;
  unknownTime: boolean;
  region: string;
  note: string;
};

const INPUT_FORM_INITIAL: InputFormState = {
  name: '',
  gender: 'male',
  birthDate: '',
  shichen: '',
  unknownTime: false,
  region: '',
  note: '',
};

const inputFormAtom = atom<InputFormState>(INPUT_FORM_INITIAL);

const destinyFormAtom = atom<DestinyFormData | null>(null);

const destinyResultAtom = atom((get) => {
  const form = get(destinyFormAtom);
  if (!form) return null;
  if (typeof window === 'undefined') return null;
  return calculateDestiny(form);
});

export {
  inputFormAtom,
  INPUT_FORM_INITIAL,
  destinyFormAtom,
  destinyResultAtom,
};
export type { InputFormState };
