import { GAME_MODE } from '@views/home/config/game';
import { type GameMode } from '@views/home/model/types/game';

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  [GAME_MODE.CLASSIC]: '클래식',
  [GAME_MODE.KILLER]: '킬러',
};

export const GAME_MODE_TABS: readonly { label: string; value: GameMode }[] = Object.values(GAME_MODE).map((value) => ({
  label: GAME_MODE_LABELS[value],
  value,
}));
