import { MINIGAME_MODE, MINIGAME_PHASE } from '../constants/minigame';

export type MinigamePhase =
  (typeof MINIGAME_PHASE)[keyof typeof MINIGAME_PHASE];

export type MinigameMode = (typeof MINIGAME_MODE)[keyof typeof MINIGAME_MODE];

export type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
};
