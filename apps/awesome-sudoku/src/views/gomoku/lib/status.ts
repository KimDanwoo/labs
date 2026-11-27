import { STONE } from '@views/gomoku/config/board';
import { GOMOKU_COPY, OUTCOME_TITLE, STONE_NOTE } from '@views/gomoku/config/copy';
import { OUTCOME } from '@views/gomoku/config/game';
import type { Outcome, Stone } from '@views/gomoku/model/types/gomoku';

export interface GomokuStatusView {
  text: string;
  note: string | null;
  stone: Stone | null;
}

const opponentOf = (stone: Stone): Stone => (stone === STONE.BLACK ? STONE.WHITE : STONE.BLACK);

export const statusViewOf = (outcome: Outcome, isThinking: boolean, playerStone: Stone): GomokuStatusView => {
  if (outcome !== OUTCOME.PLAYING) return { text: OUTCOME_TITLE[outcome], note: null, stone: null };
  if (isThinking) return { text: GOMOKU_COPY.thinking, note: null, stone: opponentOf(playerStone) };
  return { text: GOMOKU_COPY.myTurn, note: STONE_NOTE[playerStone], stone: playerStone };
};
