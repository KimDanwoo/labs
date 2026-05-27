export type MinigamePhase = 'ready' | 'playing' | 'result';

export type FallingItem = {
  id: number;
  x: number;
  y: number;
  emoji: string;
  speed: number;
};
