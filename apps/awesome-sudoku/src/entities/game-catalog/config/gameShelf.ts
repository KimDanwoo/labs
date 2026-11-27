import { GAME_LIST, type GameId } from '@entities/game-catalog/config/games';

export interface ShelfGame {
  id: GameId;
  href: string;
  name: string;
  category: string;
  description: string;
}

type CatalogEntry = (typeof GAME_LIST)[number];

const FEATURED_GAME_ID: GameId = 'guess';
const SHELF_NAMES: Partial<Record<GameId, string>> = { guess: '오늘의 맞춰봐' };

const isFeatured = ([id]: CatalogEntry): boolean => id === FEATURED_GAME_ID;

const toShelfGame = ([id, game]: CatalogEntry): ShelfGame => ({
  id,
  href: game.href,
  name: SHELF_NAMES[id] ?? game.name,
  category: game.category,
  description: game.description,
});

export const GAME_SHELF: readonly ShelfGame[] = [
  ...GAME_LIST.filter(isFeatured),
  ...GAME_LIST.filter((entry) => !isFeatured(entry)),
].map(toShelfGame);
