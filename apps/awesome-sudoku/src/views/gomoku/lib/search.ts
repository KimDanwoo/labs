import {
  FORCING_BUDGET_MS,
  FORCING_BUDGET_RATIO,
  INNER_WIDTH,
  MAX_DEPTH,
  MAX_PLY,
  MAX_TABLE_ENTRIES,
  ROOT_WIDTH,
  SEARCH_BOUND,
  THINK_MS,
  TIME_CHECK_MASK,
  WIN_SCORE,
} from '@views/gomoku/config/ai';
import { CENTER_CELL } from '@views/gomoku/config/board';
import { rivalOf } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { findForcingMove } from '@views/gomoku/lib/forcingSearch';
import {
  completionCells,
  createPosition,
  evaluate,
  hasCompletion,
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
  table: Map<bigint, SearchEntry>;
}

interface SearchEntry {
  depth: number;
  value: number;
  bound: (typeof SEARCH_BOUND)[keyof typeof SEARCH_BOUND];
  move: number;
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
  completionCells(pos, rivalOf(stone)).filter((cell) => !isForbidden(pos.cells, cell, stone));

interface SearchBranch {
  moves: readonly number[];
  bounds: Bounds;
}

const pickBest = (ctx: SearchContext, stone: Stone, { moves, bounds }: SearchBranch): Choice => {
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

const cachedValue = (entry: SearchEntry | undefined, bounds: Bounds): number | null => {
  if (!entry) return null;
  if (entry.depth < bounds.depth) return null;
  if (entry.bound === SEARCH_BOUND.EXACT) return entry.value;
  const canCut = entry.bound === SEARCH_BOUND.LOWER ? entry.value >= bounds.beta : entry.value <= bounds.alpha;
  return canCut ? entry.value : null;
};

const boundOf = (value: number, bounds: Bounds): SearchEntry['bound'] => {
  if (value <= bounds.alpha) return SEARCH_BOUND.UPPER;
  return value >= bounds.beta ? SEARCH_BOUND.LOWER : SEARCH_BOUND.EXACT;
};

const searchChildren = (ctx: SearchContext, stone: Stone, bounds: Bounds): Choice => {
  const isForced = hasCompletion(ctx.pos, rivalOf(stone));
  const isLeaf = bounds.ply >= MAX_PLY || (!isForced && bounds.depth <= 0);
  if (isLeaf) return { move: -1, value: evaluate(ctx.pos, stone) };
  const moves = isForced ? blockingMoves(ctx.pos, stone) : rankCandidates(ctx.pos, stone, INNER_WIDTH);
  if (moves.length === 0) return { move: -1, value: isForced ? bounds.ply - WIN_SCORE : 0 };
  const key = (ctx.pos.key << 2n) | BigInt(stone);
  const preferred = ctx.table.get(key)?.move;
  const ordered = [...moves.filter((move) => move === preferred), ...moves.filter((move) => move !== preferred)];
  const depth = isForced ? bounds.depth : bounds.depth - 1;
  return pickBest(ctx, stone, { moves: ordered, bounds: { ...bounds, depth } });
};

function negamax(ctx: SearchContext, stone: Stone, bounds: Bounds): number {
  if (hasCompletion(ctx.pos, stone)) return WIN_SCORE - bounds.ply;
  tick(ctx);
  if (ctx.isExpired) return 0;
  const key = (ctx.pos.key << 2n) | BigInt(stone);
  const cached = cachedValue(ctx.table.get(key), bounds);
  if (cached !== null) return cached;
  const choice = searchChildren(ctx, stone, bounds);
  const canStore = !ctx.isExpired && ctx.table.size < MAX_TABLE_ENTRIES;
  if (canStore) ctx.table.set(key, { ...choice, depth: bounds.depth, bound: boundOf(choice.value, bounds) });
  return choice.value;
}

interface DeepeningOptions {
  moves: number[];
  maxDepth: number;
}

const deepen = (ctx: SearchContext, stone: Stone, { moves, maxDepth }: DeepeningOptions): number[] => {
  let ordered = moves;
  for (let depth = 0; depth < maxDepth && ordered.length > 1; depth += 1) {
    const bounds = { depth, alpha: -Infinity, beta: Infinity, ply: 0 };
    const { move, value } = pickBest(ctx, stone, { moves: ordered, bounds });
    if (ctx.isExpired) break;
    ordered = [move, ...ordered.filter((other) => other !== move)];
    if (Math.abs(value) >= WIN_SCORE - MAX_PLY) break;
  }
  return ordered;
};

const rootMoves = (pos: Position, stone: Stone): number[] => {
  const rival = rivalOf(stone);
  if (hasCompletion(pos, stone)) return completionCells(pos, stone).slice(0, 1);
  if (hasCompletion(pos, rival)) return blockingMoves(pos, stone);
  return rankCandidates(pos, stone, ROOT_WIDTH);
};

export const chooseMove = (cells: ArrayLike<number>, stone: Stone, limits: SearchLimits = DEFAULT_LIMITS): number => {
  const pos = createPosition(cells);
  if (pos.stones === 0) return CENTER_CELL;
  const started = performance.now();
  const ctx: SearchContext = {
    pos,
    deadline: started + limits.budgetMs,
    nodes: 0,
    isExpired: false,
    table: new Map(),
  };
  const moves = rootMoves(pos, stone);
  if (moves.length > 1) {
    const forcingBudget = Math.min(FORCING_BUDGET_MS, limits.budgetMs * FORCING_BUDGET_RATIO);
    const forcing = findForcingMove(pos, stone, started + forcingBudget);
    if (forcing !== null) return forcing;
  }
  const ordered = deepen(ctx, stone, { moves, maxDepth: limits.maxDepth });
  return ordered[0] ?? rankCandidates(pos, stone, 1)[0] ?? -1;
};
