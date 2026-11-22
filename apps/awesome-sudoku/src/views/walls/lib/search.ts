import { INNER_WIDTH, MAX_DEPTH, THINK_MS, TIME_CHECK_MASK } from '@views/walls/config/ai';
import { boardOf, play, unplay } from '@views/walls/lib/board';
import { rivalOf } from '@views/walls/lib/grid';
import { legalMoves } from '@views/walls/lib/moves';
import { assess } from '@views/walls/lib/territory';
import type { Board, Move, Side } from '@views/walls/model/types/walls';

export interface SearchLimits {
  budgetMs: number;
  maxDepth: number;
}

interface SearchContext {
  board: Board;
  deadline: number;
  nodes: number;
  isExpired: boolean;
}

interface Scored {
  move: Move;
  value: number;
  isOver: boolean;
}

interface Bounds {
  depth: number;
  alpha: number;
  beta: number;
}

const DEFAULT_LIMITS: SearchLimits = { budgetMs: THINK_MS, maxDepth: MAX_DEPTH };

const tick = (ctx: SearchContext): void => {
  ctx.nodes += 1;
  const isCheckpoint = (ctx.nodes & TIME_CHECK_MASK) === 0;
  if (isCheckpoint) ctx.isExpired = performance.now() > ctx.deadline;
};

const scoreMoves = ({ board }: SearchContext, side: Side): Scored[] =>
  legalMoves(board, side)
    .map((move) => {
      const from = board.pawns[move.pawn]!;
      play(board, move);
      const scored = { move, ...assess(board, side) };
      unplay(board, move, from);
      return scored;
    })
    .sort((a, b) => b.value - a.value);

const pickBest = (ctx: SearchContext, candidates: readonly Scored[], side: Side, bounds: Bounds): Scored | null => {
  let best: Scored | null = null;
  for (const candidate of candidates) {
    const from = ctx.board.pawns[candidate.move.pawn]!;
    play(ctx.board, candidate.move);
    const floor = Math.max(bounds.alpha, best?.value ?? -Infinity);
    const value = candidate.isOver
      ? candidate.value
      : -negamax(ctx, rivalOf(side), { depth: bounds.depth - 1, alpha: -bounds.beta, beta: -floor });
    unplay(ctx.board, candidate.move, from);
    const isBetter = best === null || value > best.value;
    if (isBetter) best = { ...candidate, value };
    const isCutoff = value >= bounds.beta || ctx.isExpired;
    if (isCutoff) break;
  }
  return best;
};

function negamax(ctx: SearchContext, side: Side, bounds: Bounds): number {
  tick(ctx);
  if (ctx.isExpired) return 0;
  const scored = scoreMoves(ctx, side);
  if (bounds.depth <= 1) return scored[0]?.value ?? 0;
  return pickBest(ctx, scored.slice(0, INNER_WIDTH), side, bounds)?.value ?? 0;
}

export const chooseMove = (moves: readonly Move[], side: Side, limits: SearchLimits = DEFAULT_LIMITS): Move | null => {
  const ctx: SearchContext = {
    board: boardOf(moves),
    deadline: performance.now() + limits.budgetMs,
    nodes: 0,
    isExpired: false,
  };
  let ordered = scoreMoves(ctx, side);
  for (let depth = 2; depth <= limits.maxDepth && ordered.length > 1; depth += 1) {
    const best = pickBest(ctx, ordered, side, { depth, alpha: -Infinity, beta: Infinity });
    const isUsable = best !== null && !ctx.isExpired;
    if (!isUsable) break;
    ordered = [best, ...ordered.filter((other) => other.move !== best.move)];
  }
  return ordered[0]?.move ?? null;
};
