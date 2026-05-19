import { atom } from 'jotai';

import { calculateDestiny } from '../lib/calculateDestiny';

import type { DestinyFormData } from './types';

const destinyFormAtom = atom<DestinyFormData | null>(null);

const destinyResultAtom = atom((get) => {
  const form = get(destinyFormAtom);
  if (!form) return null;
  return calculateDestiny(form);
});

export { destinyFormAtom, destinyResultAtom };
