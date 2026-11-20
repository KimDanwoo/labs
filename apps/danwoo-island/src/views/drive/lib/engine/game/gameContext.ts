import type { Game } from '@views/drive/lib/engine/game/game';

let current: Game | null = null;

export function bindGame(game: Game): void {
  const isOtherGameRunning = current && current !== game;
  if (isOtherGameRunning) throw new Error('Game is already running');
  current = game;
}

export function peekGame(): Game | null {
  return current;
}

export function getGame(): Game {
  if (!current) throw new Error('Game has not started');
  return current;
}
