import { RUN_PHASE } from '../constants/run';

export type RunPhase = (typeof RUN_PHASE)[keyof typeof RUN_PHASE];

export type RunObstacle = {
  id: number;
  x: number;
  emoji: string;
};

export type RunHeart = {
  id: number;
  x: number;
  y: number;
};

export type RunPickup = { id: number; x: number; y: number };
