import { FORCING_DEPTH } from '@views/gomoku/config/ai';
import { rivalOf } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { completionCells, forcingCandidates, hasCompletion, shift, type Position } from '@views/gomoku/lib/position';
import { findWinLine } from '@views/gomoku/lib/winLine';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export interface ForcingStats {
  deepestPly: number;
}

interface ForcingContext {
  stats?: ForcingStats;
  pos: Position;
  stone: Stone;
  deadline: number;
}

const continuesAttack = (ctx: ForcingContext, move: number, depth: number): boolean => {
  const { pos, stone } = ctx;
  const rival = rivalOf(stone);
  shift(pos, move, stone, 1);
  const ply = 2 * (FORCING_DEPTH - depth) + 1;
  if (ctx.stats) ctx.stats.deepestPly = Math.max(ctx.stats.deepestPly, ply);
  const threats = completionCells(pos, stone);
  const isForcing = threats.length > 0 && !hasCompletion(pos, rival);
  let hasWin = false;
  if (isForcing) {
    const block = threats[0]!;
    const isUnblockable = threats.length > 1 || isForbidden(pos.cells, block, rival);
    if (isUnblockable) hasWin = true;
    else {
      shift(pos, block, rival, 1);
      if (ctx.stats) ctx.stats.deepestPly = Math.max(ctx.stats.deepestPly, ply + 1);
      const canContinue = findWinLine(pos.cells, block) === null && depth > 1;
      if (canContinue) hasWin = forcingMove(ctx, depth - 1) !== null;
      shift(pos, block, rival, -1);
    }
  }
  shift(pos, move, stone, -1);
  return hasWin;
};

function forcingMove(ctx: ForcingContext, depth: number): number | null {
  if (performance.now() >= ctx.deadline) return null;
  const moves = forcingCandidates(ctx.pos, ctx.stone);
  for (const move of moves) {
    if (performance.now() >= ctx.deadline) return null;
    if (continuesAttack(ctx, move, depth)) return move;
  }
  return null;
}

export const findForcingMove = (pos: Position, stone: Stone, deadline: number, stats?: ForcingStats): number | null =>
  forcingMove({ pos, stone, deadline, stats }, FORCING_DEPTH);
