import type { CharacterId } from '@shared/types';
import { CHARACTER_SELECT_STEP } from '../constants';

export type CharacterSelectStep =
	(typeof CHARACTER_SELECT_STEP)[keyof typeof CHARACTER_SELECT_STEP];

export type PendingCharacter = {
	id: CharacterId;
	defaultNickname: string;
} | null;
