import type { Game } from './game';

let current: Game | null = null;

export function bindGame(game: Game): void {
  if (current && current !== game) throw new Error('Game is already running');
  current = game;
}

export function peekGame(): Game | null {
  return current;
}

export function getGame(): Game {
  if (!current) throw new Error('Game has not started');
  return current;
}
