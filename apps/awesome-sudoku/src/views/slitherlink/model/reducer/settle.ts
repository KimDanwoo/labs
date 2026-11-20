import { GAME_PHASE } from '@views/slitherlink/config/game';
import { JUDGEMENT } from '@views/slitherlink/config/judgement';
import { judgeDrawing } from '@views/slitherlink/lib/judgement';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { GameState, HistoryEntry } from '@views/slitherlink/model/types/game';
import type { EdgeState, SlitherlinkPuzzle } from '@views/slitherlink/model/types/slitherlink';

interface Settled {
  edges: readonly EdgeState[];
  past: readonly HistoryEntry[];
  future: readonly HistoryEntry[];
}

export const settle = (state: GameState, puzzle: SlitherlinkPuzzle, next: Settled): GameState => {
  const judgement = judgeDrawing(next.edges, puzzle.solution, getTopology(puzzle.size));
  return {
    ...state,
    ...next,
    judgement,
    phase: judgement === JUDGEMENT.SOLVED ? GAME_PHASE.SOLVED : GAME_PHASE.PLAYING,
    lastHintEdge: null,
    stroke: null,
  };
};

export const commitEntry = (
  state: GameState,
  puzzle: SlitherlinkPuzzle,
  edges: readonly EdgeState[],
  entry: HistoryEntry,
): GameState => {
  if (entry.length === 0) return { ...state, edges, stroke: null };
  return settle(state, puzzle, { edges, past: [...state.past, entry], future: [] });
};
