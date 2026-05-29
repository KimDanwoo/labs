import { atom } from 'jotai';
import { CHARACTER_SELECT_STEP } from '../constants';
import type { CharacterSelectStep, PendingCharacter } from '../types';

export const stepAtom = atom<CharacterSelectStep>(CHARACTER_SELECT_STEP.INTRO);

export const pendingCharacterAtom = atom<PendingCharacter>(null);
