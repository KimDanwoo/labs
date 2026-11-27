export {
  GAMES,
  GAME_LIST,
  SITE_DESCRIPTION,
  SITE_HEADLINE,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from '@entities/game-catalog/config/games';
export type { GameId } from '@entities/game-catalog/config/games';
export { GAME_SHELF } from '@entities/game-catalog/config/gameShelf';
export type { ShelfGame } from '@entities/game-catalog/config/gameShelf';
export { findGameByPath } from '@entities/game-catalog/lib/findGameByPath';
export { GameHeading } from '@entities/game-catalog/ui/GameHeading';
