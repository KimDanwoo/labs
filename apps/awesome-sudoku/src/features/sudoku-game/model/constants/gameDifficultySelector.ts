import { GAME_LEVEL, GAME_LEVEL_LABELS } from '@entities/game/model/constants';

export const options = [
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EASY], value: GAME_LEVEL.EASY },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.MEDIUM], value: GAME_LEVEL.MEDIUM },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.HARD], value: GAME_LEVEL.HARD },
  { label: GAME_LEVEL_LABELS[GAME_LEVEL.EXPERT], value: GAME_LEVEL.EXPERT },
];
