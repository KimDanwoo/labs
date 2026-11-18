import { GAME_MODE, type GameMode } from '@entities/game';

export const GAME_MODE_TABS: readonly { label: string; value: GameMode }[] = [
  { label: '클래식', value: GAME_MODE.CLASSIC },
  { label: '킬러', value: GAME_MODE.KILLER },
];
