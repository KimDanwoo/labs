import { GAME_LEVEL_LABELS } from '@entities/sudoku/config/game';
import { GAME_MODE_LABELS } from '@entities/sudoku/config/gameMode';
import type { DiscardAction, NewGameRequest } from '@entities/sudoku/model/types/game';

export const newGameLabel = ({ mode, difficulty }: NewGameRequest): string =>
  `${GAME_MODE_LABELS[mode]} · ${GAME_LEVEL_LABELS[difficulty]}`;

export const discardDetail = (action: DiscardAction): string | null =>
  action.kind === 'newGame' ? newGameLabel(action.request) : null;
