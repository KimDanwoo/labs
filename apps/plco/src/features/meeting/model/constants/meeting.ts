import type { CharacterId } from '@shared/types';

export const MEETING_CHARACTERS: CharacterId[] = [
  'yeko',
  'ako',
  'bamko',
  'eunko',
  'hako',
];
export const MEETING_RANDOM_NAMES = [
  '별빛이',
  '달콤이',
  '반짝이',
  '구름이',
  '하늘이',
  '무지개',
  '솜사탕',
  '꽃잎이',
];
export const MEETING_MATCHING_MS = 2000;
export const MEETING_FOUND_MS = 1500;
export const MEETING_REACTION_MS = 1200;

export const MEETING_PHASE = {
  SEARCHING: 'searching',
  FOUND: 'found',
  CHAT: 'chat',
  RESULT: 'result',
} as const;

export const CONVERSATION_OUTCOME = {
  GOOD: 'good',
  OK: 'ok',
  AWKWARD: 'awkward',
} as const;
