import { GAME_LEVEL_LABELS } from '../config/game';
import { GAME_MODE_LABELS } from '../config/gameMode';
import type { NewGameRequest } from '../model/types/game';

export const newGameLabel = ({ mode, difficulty }: NewGameRequest): string =>
  `${GAME_MODE_LABELS[mode]} · ${GAME_LEVEL_LABELS[difficulty]}`;
