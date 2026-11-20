import { GAME_MODE } from '@entities/sudoku/config/game';
import { type GameMode } from '@entities/sudoku/model/types/game';

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  [GAME_MODE.CLASSIC]: '클래식',
  [GAME_MODE.KILLER]: '킬러',
};

export const GAME_MODE_TITLES: Record<GameMode, string> = {
  [GAME_MODE.CLASSIC]: '클래식 스도쿠',
  [GAME_MODE.KILLER]: '킬러 스도쿠',
};
