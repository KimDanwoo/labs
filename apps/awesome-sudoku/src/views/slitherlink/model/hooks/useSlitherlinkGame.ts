import { EDGE } from '@views/slitherlink/config/board';
import { SLITHERLINK_DIFFICULTY } from '@views/slitherlink/config/difficulty';
import { GAME_ACTION, GAME_PHASE, INITIAL_LEVEL } from '@views/slitherlink/config/game';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { useNewGameConfirm, type NewGameConfirm } from '@views/slitherlink/model/hooks/useNewGameConfirm';
import { usePuzzleRequest } from '@views/slitherlink/model/hooks/usePuzzleRequest';
import { createInitialState, gameReducer } from '@views/slitherlink/model/reducer/gameReducer';
import type { EdgeState, SlitherlinkLevel, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';
import { useCallback, useMemo, useReducer } from 'react';

export interface SlitherlinkGame {
  level: SlitherlinkLevel;
  boardSize: number;
  puzzle: SlitherlinkPuzzle | null;
  edges: readonly EdgeState[];
  lastHintEdge: number | null;
  hintsRemaining: number;
  isGenerating: boolean;
  isPlaying: boolean;
  isSolved: boolean;
  isWrongLoop: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canHint: boolean;
  confirm: NewGameConfirm;
  tapEdge: (edge: number) => void;
  beginStroke: (vertex: number) => void;
  strokeTo: (vertex: number) => void;
  endStroke: () => void;
  cancelStroke: () => void;
  undo: () => void;
  redo: () => void;
  takeHint: () => void;
  startGame: (level: SlitherlinkLevel) => void;
}

export const useSlitherlinkGame = (): SlitherlinkGame => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_LEVEL, createInitialState);
  usePuzzleRequest(state, dispatch);

  const isPlaying = state.phase === GAME_PHASE.PLAYING;
  const isInProgress = isPlaying && state.edges.some((edge) => edge !== EDGE.UNKNOWN);
  const startGame = useCallback((level: SlitherlinkLevel) => dispatch({ type: GAME_ACTION.GENERATE, level }), []);
  const confirm = useNewGameConfirm(isInProgress, state.level, startGame);

  const actions = useMemo(
    () => ({
      tapEdge: (edge: number) => dispatch({ type: GAME_ACTION.TAP_EDGE, edge }),
      beginStroke: (vertex: number) => dispatch({ type: GAME_ACTION.STROKE_BEGIN, vertex }),
      strokeTo: (vertex: number) => dispatch({ type: GAME_ACTION.STROKE_TO, vertex }),
      endStroke: () => dispatch({ type: GAME_ACTION.STROKE_END }),
      cancelStroke: () => dispatch({ type: GAME_ACTION.STROKE_CANCEL }),
      undo: () => dispatch({ type: GAME_ACTION.UNDO }),
      redo: () => dispatch({ type: GAME_ACTION.REDO }),
      takeHint: () => dispatch({ type: GAME_ACTION.HINT, roll: Math.random() }),
    }),
    [],
  );

  return useMemo(
    () => ({
      ...actions,
      level: state.level,
      boardSize: state.puzzle?.size ?? SLITHERLINK_DIFFICULTY[state.level].size,
      puzzle: state.puzzle,
      edges: state.edges,
      lastHintEdge: state.lastHintEdge,
      hintsRemaining: state.hintsRemaining,
      isGenerating: state.phase === GAME_PHASE.GENERATING,
      isPlaying,
      isSolved: state.phase === GAME_PHASE.SOLVED,
      isWrongLoop: isPlaying && state.judgement === JUDGEMENT.WRONG_LOOP,
      canUndo: isPlaying && state.past.length > 0,
      canRedo: isPlaying && state.future.length > 0,
      canHint: isPlaying && state.hintsRemaining > 0,
      confirm,
      startGame,
    }),
    [actions, state, isPlaying, confirm, startGame],
  );
};
