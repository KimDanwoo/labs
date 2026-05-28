import { atom } from 'jotai';
import { selectAtom } from 'jotai/utils';
import type { CharacterPosition, RoomType } from '@shared/types';
import {
  DANGER_THRESHOLD,
  ALL_CHARACTER_IDS,
  WAKE_UP_GRACE_MS,
} from '@shared/constants';
import { gameAtom } from './gameAtom';
import { activeModalAtom } from './modalAtom';

export const statusAtom = selectAtom(gameAtom, (s) => s.status);
export const characterIdAtom = selectAtom(gameAtom, (s) => s.characterId);
export const nicknameAtom = selectAtom(gameAtom, (s) => s.nickname);
export const levelAtom = selectAtom(gameAtom, (s) => s.level);
export const hungerAtom = selectAtom(gameAtom, (s) => s.hunger);
export const cleanlinessAtom = selectAtom(gameAtom, (s) => s.cleanliness);
export const heartsAtom = selectAtom(gameAtom, (s) => s.hearts);
export const coinsAtom = selectAtom(gameAtom, (s) => s.coins);
export const poopsAtom = selectAtom(gameAtom, (s) => s.poops);
export const inventoryAtom = selectAtom(gameAtom, (s) => s.inventory);
export const isSleepingAtom = selectAtom(gameAtom, (s) => s.isSleeping);
export const isSickAtom = selectAtom(gameAtom, (s) => s.isSick);
export const wokeUpAtAtom = selectAtom(gameAtom, (s) => s.wokeUpAt);
export const eggReadyCharacterIdAtom = selectAtom(
  gameAtom,
  (s) => s.eggReadyCharacterId,
);
export const lastMeetingAtAtom = selectAtom(gameAtom, (s) => s.lastMeetingAt);
export const meetingsTodayAtom = selectAtom(gameAtom, (s) => s.meetingsToday);
export const meetingDayAtom = selectAtom(gameAtom, (s) => s.meetingDay);
export const minigamesTodayAtom = selectAtom(gameAtom, (s) => s.minigamesToday);
export const minigameDayAtom = selectAtom(gameAtom, (s) => s.minigameDay);
export const levelUpMessageAtom = selectAtom(gameAtom, (s) => s.levelUpMessage);
export const feedingMessageAtom = selectAtom(gameAtom, (s) => s.feedingMessage);
export const unlockedCharactersAtom = selectAtom(
  gameAtom,
  (s) => s.unlockedCharacters,
);

export const isPlayingAtom = atom((get) => get(statusAtom) === 'playing');

export const isDrowsyAtom = atom((get) => {
  const isSleeping = get(isSleepingAtom);
  const wokeUpAt = get(wokeUpAtAtom);
  return !isSleeping && wokeUpAt !== null && Date.now() - wokeUpAt <= WAKE_UP_GRACE_MS;
});

export const hasFoodAtom = atom((get) =>
  Object.values(get(inventoryAtom)).some((count) => count > 0),
);

export const isDangerAtom = atom((get) => {
  const hunger = get(hungerAtom);
  const cleanliness = get(cleanlinessAtom);
  return hunger <= DANGER_THRESHOLD || cleanliness <= DANGER_THRESHOLD;
});

export const isAllUnlockedAtom = atom((get) => {
  const characterId = get(characterIdAtom);
  const unlocked = new Set([
    ...(get(unlockedCharactersAtom) ?? []),
    characterId,
  ]);
  return ALL_CHARACTER_IDS.every((id) => unlocked.has(id));
});

export const roomTypeAtom = atom<RoomType>((get) => {
  if (get(isSleepingAtom)) return 'bedroom';
  if (get(activeModalAtom) === 'meeting') return 'outdoor';
  if (get(cleanlinessAtom) <= 30 && get(poopsAtom).length >= 3) return 'bathroom';
  return 'living';
});

export const characterPositionAtom = atom<CharacterPosition>({
  x: 50,
  y: 70,
  direction: 'right',
  isMoving: false,
});
