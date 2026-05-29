import { MINIGAME_PHASE } from '../constants/minigame';

export type MinigamePhase = (typeof MINIGAME_PHASE)[keyof typeof MINIGAME_PHASE];

export type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
};
