import { MINIGAME_MODE, MINIGAME_PHASE } from '../constants/minigame';

export type MinigamePhase = (typeof MINIGAME_PHASE)[keyof typeof MINIGAME_PHASE];
export type MinigameMode = (typeof MINIGAME_MODE)[keyof typeof MINIGAME_MODE];
export type FallingItemKind = 'good' | 'bad';
export type CatchFloatVariant = 'good' | 'bad';

export type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
  kind: FallingItemKind;
};

export type CatchFloat = {
  id: number;
  x: number;
  y: number;
  text: string;
  variant: CatchFloatVariant;
};
