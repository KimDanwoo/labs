import { GAME_ACTION } from '@views/walls/config/game';
import { boardOf } from '@views/walls/lib/board';
import { sideAtPly } from '@views/walls/lib/grid';
import { isLegal } from '@views/walls/lib/moves';
import { surveyTerritory } from '@views/walls/lib/territory';
import type { GameAction, GameState, Move, Side } from '@views/walls/model/types/walls';

export const INITIAL_STATE: GameState = { moves: [] };

const playMove = (state: GameState, move: Move, side: Side): GameState => {
  const board = boardOf(state.moves);
  const isAllowed =
    side === sideAtPly(state.moves.length) && !surveyTerritory(board).isOver && isLegal(board, side, move);
  return isAllowed ? { moves: [...state.moves, move] } : state;
};

const undo = (state: GameState): GameState => {
  if (state.moves.length === 0) return state;
  const isMyTurn = state.moves.length % 2 === 0;
  return { moves: state.moves.slice(0, isMyTurn ? -2 : -1) };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === GAME_ACTION.PLAY) return playMove(state, action.move, action.side);
  if (action.type === GAME_ACTION.UNDO) return undo(state);
  return INITIAL_STATE;
};
