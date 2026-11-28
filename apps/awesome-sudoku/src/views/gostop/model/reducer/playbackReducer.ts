import { GAME_ACTION } from '@views/gostop/config/game';
import { MOTION, PLAYBACK_ACTION } from '@views/gostop/config/playback';
import { announce } from '@views/gostop/lib/announce';
import { collapseSteps, transitionSteps } from '@views/gostop/lib/playback';
import { gameReducer, INITIAL_STATE } from '@views/gostop/model/reducer/gameReducer';
import type { GameAction } from '@views/gostop/model/types/gostop';
import type { Motion, PlaybackAction, PlaybackState } from '@views/gostop/model/types/playback';

export const INITIAL_PLAYBACK: PlaybackState = {
  game: INITIAL_STATE,
  steps: [],
  cursor: 0,
  gameId: null,
  announcement: '',
};

const RESTART_ACTIONS: ReadonlySet<string> = new Set([GAME_ACTION.DEAL, GAME_ACTION.RESET]);

export const isPlaybackRunning = (state: PlaybackState): boolean => state.cursor < state.steps.length;

function apply(state: PlaybackState, action: GameAction, motion: Motion, gameId?: string): PlaybackState {
  const isLocked = isPlaybackRunning(state) && !RESTART_ACTIONS.has(action.type);
  if (isLocked) return state;
  const game = gameReducer(state.game, action);
  if (game === state.game) return state;
  const steps = transitionSteps(state.game, game, action);
  return {
    game,
    steps: motion === MOTION.REDUCED ? collapseSteps(steps) : steps,
    cursor: 0,
    gameId: gameId ?? (action.type === GAME_ACTION.RESET ? null : state.gameId),
    announcement: announce(state.game, game, action),
  };
}

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  if (action.type === PLAYBACK_ACTION.ADVANCE) {
    return action.steps === state.steps ? { ...state, cursor: state.cursor + 1 } : state;
  }
  return apply(state, action.action, action.motion, action.gameId);
}
