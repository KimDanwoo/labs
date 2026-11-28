import type { MOOD, REACTION } from '@views/gostop/config/rival';
import type { GameState } from '@views/gostop/model/types/gostop';

export type Mood = (typeof MOOD)[keyof typeof MOOD];
export type Reaction = (typeof REACTION)[keyof typeof REACTION];

export interface RivalReaction {
  reaction: Reaction;
  mood: Mood;
  line: string | null;
}

export interface BubbleCue {
  game: GameState;
  reaction: Reaction;
  mood: Mood;
  line: string;
}

export interface ShownBubble {
  id: number;
  mood: Mood;
  line: string;
}
