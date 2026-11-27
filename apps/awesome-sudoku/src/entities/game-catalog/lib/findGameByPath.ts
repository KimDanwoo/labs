import { GAME_SHELF, type ShelfGame } from '@entities/game-catalog/config/gameShelf';

const isPathWithin = (pathname: string, href: string): boolean => pathname === href || pathname.startsWith(`${href}/`);

export const findGameByPath = (pathname: string): ShelfGame | undefined =>
  GAME_SHELF.find(({ href }) => isPathWithin(pathname, href));
