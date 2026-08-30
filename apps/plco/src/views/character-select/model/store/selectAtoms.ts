import { CHARACTER_SELECT_STEP } from '@views/character-select/model/constants';
import type { CharacterSelectStep, PendingCharacter } from '@views/character-select/model/types';
import { atom } from 'jotai';

export const stepAtom = atom<CharacterSelectStep>(CHARACTER_SELECT_STEP.INTRO);

export const pendingCharacterAtom = atom<PendingCharacter>(null);
