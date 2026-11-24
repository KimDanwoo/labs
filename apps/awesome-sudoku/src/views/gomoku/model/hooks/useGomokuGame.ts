import { CELL_COUNT, STONE } from '@views/gomoku/config/board';
import { GAME_ACTION, OUTCOME } from '@views/gomoku/config/game';
import { cellsOf } from '@views/gomoku/lib/board';
import { rivalOf, stoneAtPly } from '@views/gomoku/lib/coords';
import { forbiddenCells } from '@views/gomoku/lib/forbidden';
import { useComputerMove } from '@views/gomoku/model/hooks/useComputerMove';
import { gameReducer, INITIAL_STATE } from '@views/gomoku/model/reducer/gameReducer';
import type { Cell, GameState, Outcome, Stone } from '@views/gomoku/model/types/gomoku';
import { useMemo, useReducer } from 'react';

export interface GomokuGame {
  playerStone: Stone;
  cells: readonly Cell[];
  forbidden: ReadonlySet<number>;
  lastMove: number | null;
  winLine: readonly number[] | null;
  outcome: Outcome;
  isThinking: boolean;
  isLocked: boolean;
  canUndo: boolean;
  place: (cell: number) => void;
  undo: () => void;
  reset: () => void;
  selectStone: (stone: Stone) => void;
}

const NO_CELLS: ReadonlySet<number> = new Set();

const outcomeOf = ({ moves, winLine, playerStone }: GameState): Outcome => {
  if (winLine) return stoneAtPly(moves.length - 1) === playerStone ? OUTCOME.WON : OUTCOME.LOST;
  return moves.length === CELL_COUNT ? OUTCOME.DRAW : OUTCOME.PLAYING;
};

export const useGomokuGame = (): GomokuGame => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const { playerStone } = state;
  const computerStone = rivalOf(playerStone);
  const cells = useMemo(() => cellsOf(state.moves), [state.moves]);
  const outcome = outcomeOf(state);
  const isThinking = outcome === OUTCOME.PLAYING && stoneAtPly(state.moves.length) === computerStone;
  useComputerMove({ isThinking, cells, stone: computerStone, dispatch });
  const isLocked = isThinking || outcome !== OUTCOME.PLAYING;
  const forbidden = useMemo(
    () => (isLocked ? NO_CELLS : forbiddenCells(cells, playerStone)),
    [cells, isLocked, playerStone],
  );
  const firstPlayerPly = playerStone === STONE.BLACK ? 0 : 1;

  const actions = useMemo(
    () => ({
      place: (cell: number) => dispatch({ type: GAME_ACTION.PLACE, cell, stone: playerStone }),
      undo: () => dispatch({ type: GAME_ACTION.UNDO }),
      reset: () => dispatch({ type: GAME_ACTION.RESET }),
      selectStone: (stone: Stone) => dispatch({ type: GAME_ACTION.SELECT_STONE, stone }),
    }),
    [playerStone],
  );

  return useMemo(
    () => ({
      ...actions,
      playerStone,
      cells,
      forbidden,
      lastMove: state.moves.at(-1) ?? null,
      winLine: state.winLine,
      outcome,
      isThinking,
      isLocked,
      canUndo: state.moves.length > firstPlayerPly,
    }),
    [actions, playerStone, cells, forbidden, state, outcome, isThinking, isLocked, firstPlayerPly],
  );
};
