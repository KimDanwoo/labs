import { MOOD_LABEL, RIVAL_IMAGE, RIVAL_NAME } from '@views/gostop/config/rival';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { BubbleCue, Mood, RivalReaction, ShownBubble } from '@views/gostop/model/types/rival';

export const rivalImageSrc = (mood: Mood): string => `${RIVAL_IMAGE.folder}${mood}${RIVAL_IMAGE.extension}`;

export const rivalAlt = (mood: Mood): string => `${RIVAL_NAME}, ${MOOD_LABEL[mood]}`;

export function bubbleCueOf(game: GameState, rival: RivalReaction): BubbleCue | null {
  if (rival.line === null) return null;
  return { game, reaction: rival.reaction, mood: rival.mood, line: rival.line };
}

export function isNewCue(cue: BubbleCue | null, last: BubbleCue | null): cue is BubbleCue {
  if (cue === null) return false;
  if (last === null) return true;
  return cue.game !== last.game || cue.reaction !== last.reaction;
}

export const isEcho = (cue: BubbleCue, shown: ShownBubble | null): boolean => shown?.line === cue.line;
