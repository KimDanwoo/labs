import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { GAME_ACTION } from '@views/gomoku/config/game';
import { cellsOf } from '@views/gomoku/lib/board';
import { stoneAtPly } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { findWinLine } from '@views/gomoku/lib/winLine';
import type { GameAction, GameState, Stone } from '@views/gomoku/model/types/gomoku';

export const INITIAL_STATE: GameState = { playerStone: STONE.BLACK, moves: [], winLine: null };

const canPlace = (state: GameState, cell: number, stone: Stone): boolean =>
  !state.winLine &&
  stone === stoneAtPly(state.moves.length) &&
  Number.isInteger(cell) &&
  cell >= 0 &&
  cell < CELL_COUNT &&
  !state.moves.includes(cell) &&
  !isForbidden(cellsOf(state.moves), cell, stone);

const place = (state: GameState, cell: number, stone: Stone): GameState => {
  if (!canPlace(state, cell, stone)) return state;
  const moves = [...state.moves, cell];
  return { ...state, moves, winLine: findWinLine(cellsOf(moves), cell) };
};

const undo = (state: GameState): GameState => {
  const firstPlayerPly = state.playerStone === STONE.BLACK ? 0 : 1;
  if (state.moves.length <= firstPlayerPly) return state;
  const isPlayerTurn = stoneAtPly(state.moves.length) === state.playerStone;
  return { ...state, moves: state.moves.slice(0, isPlayerTurn ? -2 : -1), winLine: null };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  if (action.type === GAME_ACTION.PLACE) return place(state, action.cell, action.stone);
  if (action.type === GAME_ACTION.UNDO) return undo(state);
  if (action.type === GAME_ACTION.SELECT_STONE) {
    if (action.stone === state.playerStone) return state;
    return { ...INITIAL_STATE, playerStone: action.stone };
  }
  return { ...INITIAL_STATE, playerStone: state.playerStone };
};
