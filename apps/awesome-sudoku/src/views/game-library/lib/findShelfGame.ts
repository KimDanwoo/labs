import { GAME_SHELF, type GameId, type ShelfGame } from '@entities/game-catalog';

export function findShelfGame(id: GameId): ShelfGame {
  const game = GAME_SHELF.find((entry) => entry.id === id);
  if (!game) throw new Error(`게임 목록에 없는 게임이에요: ${id}`);
  return game;
}
