import { SIDE } from '@views/gostop/config/game';
import { winResult } from '@views/gostop/lib/score';
import type { GameResult, GameState, Side, Table } from '@views/gostop/model/types/gostop';

export interface StopPreview {
  stop: Record<Side, GameResult>;
  nextGo: GameResult;
}

export interface GoTag {
  count: number;
  stopPoints: number;
}

const withOneMoreGo = (game: GameState, side: Side): GameState => ({
  ...game,
  goCount: { ...game.goCount, [side]: game.goCount[side] + 1 },
});

export function stopPreviewOf(game: GameState, table: Table): StopPreview {
  const shown = { ...game, table };
  return {
    stop: { [SIDE.ME]: winResult(shown, SIDE.ME), [SIDE.COMPUTER]: winResult(shown, SIDE.COMPUTER) },
    nextGo: winResult(withOneMoreGo(shown, SIDE.ME), SIDE.ME),
  };
}

export const goTagOf = (goCount: number, stop: GameResult): GoTag | null =>
  goCount > 0 ? { count: goCount, stopPoints: stop.points } : null;
