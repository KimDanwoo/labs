import { GAME_LEVEL_LABELS } from '../config/game';
import { GAME_MODE_LABELS } from '../config/gameMode';
import type { DiscardAction, NewGameRequest } from '../model/types/game';

export const newGameLabel = ({ mode, difficulty }: NewGameRequest): string =>
  `${GAME_MODE_LABELS[mode]} · ${GAME_LEVEL_LABELS[difficulty]}`;

export const discardDetail = (action: DiscardAction): string | null =>
  action.kind === 'newGame' ? newGameLabel(action.request) : null;
