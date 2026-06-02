import { atom } from 'jotai';
import type { CharacterId } from '@shared/types';

/** 만남 후 공원에서 함께 뛰어노는 장면의 친구. null 이면 장면 비활성. */
export const meetingPlayFriendAtom = atom<CharacterId | null>(null);
