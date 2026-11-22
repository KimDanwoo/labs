import {
  INNER_WIDTH,
  MAX_DEPTH,
  MAX_PLY,
  ROOT_WIDTH,
  THINK_MS,
  TIME_CHECK_MASK,
  WIN_SCORE,
} from '@views/gomoku/config/ai';
import { CENTER_CELL } from '@views/gomoku/config/board';
import { rivalOf } from '@views/gomoku/lib/coords';
import { isDoubleThree } from '@views/gomoku/lib/forbidden';
import {
  completionCells,
  createPosition,
  evaluate,
  rankCandidates,
  shift,
  type Position,
} from '@views/gomoku/lib/position';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export interface SearchLimits {
  budgetMs: number;
  maxDepth: number;
}

interface SearchContext {
  pos: Position;
  deadline: number;
  nodes: number;
  isExpired: boolean;
}

interface Bounds {
  depth: number;
  alpha: number;
  beta: number;
  ply: number;
}

interface Choice {
  move: number;
  value: number;
}

const DEFAULT_LIMITS: SearchLimits = { budgetMs: THINK_MS, maxDepth: MAX_DEPTH };

const tick = (ctx: SearchContext): void => {
  ctx.nodes += 1;
  const isCheckpoint = (ctx.nodes & TIME_CHECK_MASK) === 0;
  if (isCheckpoint) ctx.isExpired = performance.now() > ctx.deadline;
};

const blockingMoves = (pos: Position, stone: Stone): number[] =>
  completionCells(pos, rivalOf(stone)).filter((cell) => !isDoubleThree(pos.cells, cell, stone));

const pickBest = (ctx: SearchContext, moves: readonly number[], stone: Stone, bounds: Bounds): Choice => {
  let best: Choice = { move: moves[0] ?? -1, value: -Infinity };
  for (const move of moves) {
    shift(ctx.pos, move, stone, 1);
    const value = -negamax(ctx, rivalOf(stone), {
      depth: bounds.depth,
      alpha: -bounds.beta,
      beta: -Math.max(bounds.alpha, best.value),
      ply: bounds.ply + 1,
    });
    shift(ctx.pos, move, stone, -1);
    if (value > best.value) best = { move, value };
    const isCutoff = best.value >= bounds.beta || ctx.isExpired;
    if (isCutoff) break;
  }
  return best;
};

function negamax(ctx: SearchContext, stone: Stone, bounds: Bounds): number {
  const { pos } = ctx;
  if (pos.fours[stone]! > 0) return WIN_SCORE - bounds.ply;
  tick(ctx);
  if (ctx.isExpired) return 0;
  const rival = rivalOf(stone);
  const isForced = pos.fours[rival]! > 0;
  const isLeaf = bounds.ply >= MAX_PLY || (!isForced && bounds.depth <= 0);
  if (isLeaf) return evaluate(pos, stone);
  const moves = isForced ? blockingMoves(pos, stone) : rankCandidates(pos, stone, INNER_WIDTH);
  if (moves.length === 0) return isForced ? bounds.ply - WIN_SCORE : 0;
  const depth = isForced ? bounds.depth : bounds.depth - 1;
  return pickBest(ctx, moves, stone, { ...bounds, depth }).value;
}

const rootMoves = (pos: Position, stone: Stone): number[] => {
  const rival = rivalOf(stone);
  if (pos.fours[stone]! > 0) return completionCells(pos, stone).slice(0, 1);
  if (pos.fours[rival]! > 0) return blockingMoves(pos, stone);
  return rankCandidates(pos, stone, ROOT_WIDTH);
};

export const chooseMove = (cells: ArrayLike<number>, stone: Stone, limits: SearchLimits = DEFAULT_LIMITS): number => {
  const pos = createPosition(cells);
  if (pos.stones === 0) return CENTER_CELL;
  const ctx: SearchContext = { pos, deadline: performance.now() + limits.budgetMs, nodes: 0, isExpired: false };
  let ordered = rootMoves(pos, stone);
  for (let depth = 0; depth < limits.maxDepth && ordered.length > 1; depth += 1) {
    const { move, value } = pickBest(ctx, ordered, stone, { depth, alpha: -Infinity, beta: Infinity, ply: 0 });
    if (ctx.isExpired) break;
    ordered = [move, ...ordered.filter((other) => other !== move)];
    if (Math.abs(value) >= WIN_SCORE - MAX_PLY) break;
  }
  return ordered[0] ?? rankCandidates(pos, stone, 1)[0] ?? -1;
};
