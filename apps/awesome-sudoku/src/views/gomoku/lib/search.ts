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
  WIN_SCORE,
} from '@views/gomoku/config/ai';
import { CELL_COUNT, CENTER_CELL } from '@views/gomoku/config/board';
import { rivalOf } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { findForcingMove } from '@views/gomoku/lib/forcingSearch';
import {
  completionCells,
  createPosition,
  evaluate,
  hasCompletion,
  hasUnblockableFour,
  rankCandidates,
  shift,
  type Position,
} from '@views/gomoku/lib/position';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export interface SearchLimits {
  budgetMs: number;
  maxDepth: number;
}

type Exit =
  'opening' | 'immediate-win' | 'only-move' | 'no-candidate' | 'forcing-win' | 'mate-score' | 'timeout' | 'target';

export interface SearchResult {
  cell: number;
  stats: {
    reason: Exit;
    targetDepth: number;
    selectiveCap: number;
    completedDepth: number;
    deepestPly: number;
    searchPly: number;
    forcingPly: number;
    nodes: number;
    elapsedMs: number;
  };
}

interface SearchContext {
  completedDepth: number;
  deepestPly: number;
  reason: Exit;
  history: Int32Array;
  pos: Position;
  deadline: number;
  nodes: number;
  isExpired: boolean;
  table: Map<number, SearchEntry>;
}

interface SearchEntry {
  board: bigint;
  stone: Stone;
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

const expired = (ctx: SearchContext): boolean => {
  ctx.isExpired ||= performance.now() >= ctx.deadline;
  return ctx.isExpired;
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
    if (expired(ctx)) break;
    shift(ctx.pos, move, stone, 1);
    const value = -negamax(ctx, rivalOf(stone), {
      depth: bounds.depth,
      alpha: -bounds.beta,
      beta: -Math.max(bounds.alpha, best.value),
      ply: bounds.ply + 1,
    });
    shift(ctx.pos, move, stone, -1);
    if (expired(ctx)) break;
    if (value > best.value) best = { move, value };
    if (best.value >= bounds.beta) {
      ctx.history[stone * CELL_COUNT + move]! += (bounds.depth + 1) ** 2;
      break;
    }
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

const lookup = (ctx: SearchContext, stone: Stone): SearchEntry | undefined => {
  const entry = ctx.table.get(ctx.pos.hash ^ stone);
  const isMatch = entry?.board === ctx.pos.key && entry.stone === stone;
  return isMatch ? entry : undefined;
};

const scoreLeaf = (ctx: SearchContext, stone: Stone, ply: number): Choice => {
  const hasForcedWin = ply <= MAX_PLY - 3 && hasUnblockableFour(ctx.pos, stone);
  return { move: -1, value: hasForcedWin ? WIN_SCORE - ply - 2 : evaluate(ctx.pos, stone) };
};

const searchChildren = (ctx: SearchContext, stone: Stone, bounds: Bounds): Choice => {
  const isForced = hasCompletion(ctx.pos, rivalOf(stone));
  const isLeaf = bounds.ply >= MAX_PLY || (!isForced && bounds.depth <= 0);
  if (isLeaf) return scoreLeaf(ctx, stone, bounds.ply);
  const moves = isForced ? blockingMoves(ctx.pos, stone) : rankCandidates(ctx.pos, stone, INNER_WIDTH);
  if (moves.length === 0) return { move: -1, value: isForced ? bounds.ply - WIN_SCORE : 0 };
  const preferred = lookup(ctx, stone)?.move;
  const offset = stone * CELL_COUNT;
  const ordered = moves.sort(
    (a, b) => Number(b === preferred) - Number(a === preferred) || ctx.history[offset + b]! - ctx.history[offset + a]!,
  );
  const depth = isForced ? bounds.depth : bounds.depth - 1;
  return pickBest(ctx, stone, { moves: ordered, bounds: { ...bounds, depth } });
};

function negamax(ctx: SearchContext, stone: Stone, bounds: Bounds): number {
  ctx.nodes += 1;
  ctx.deepestPly = Math.max(ctx.deepestPly, bounds.ply);
  if (expired(ctx)) return 0;
  if (hasCompletion(ctx.pos, stone)) return WIN_SCORE - bounds.ply;
  const cached = cachedValue(lookup(ctx, stone), bounds);
  if (cached !== null) return cached;
  const choice = searchChildren(ctx, stone, bounds);
  const canStore = !ctx.isExpired && ctx.table.size < MAX_TABLE_ENTRIES;
  if (canStore)
    ctx.table.set(ctx.pos.hash ^ stone, {
      board: ctx.pos.key,
      stone,
      ...choice,
      depth: bounds.depth,
      bound: boundOf(choice.value, bounds),
    });
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
    if (expired(ctx)) {
      ctx.reason = 'timeout';
      break;
    }
    ctx.completedDepth = depth + 1;
    ordered = [move, ...ordered.filter((other) => other !== move)];
    if (Math.abs(value) >= WIN_SCORE - MAX_PLY) {
      ctx.reason = 'mate-score';
      break;
    }
  }
  return ordered;
};

const rootMoves = (ctx: SearchContext, stone: Stone): number[] => {
  const { pos } = ctx;
  const rival = rivalOf(stone);
  if (hasCompletion(pos, stone)) {
    ctx.reason = 'immediate-win';
    return completionCells(pos, stone).slice(0, 1);
  }
  if (hasCompletion(pos, rival)) return blockingMoves(pos, stone);
  const ranked = rankCandidates(pos, stone, ROOT_WIDTH);
  if (!hasUnblockableFour(pos, rival)) return ranked;

  const safe: number[] = [];
  for (const move of rankCandidates(pos, stone, CELL_COUNT)) {
    if (expired(ctx)) break;
    shift(pos, move, stone, 1);
    try {
      const isSafe = !hasCompletion(pos, rival) && !hasUnblockableFour(pos, rival);
      if (isSafe) safe.push(move);
    } finally {
      shift(pos, move, stone, -1);
    }
    if (safe.length === ROOT_WIDTH) break;
  }
  return safe.length > 0 ? safe : ranked;
};

export const searchMove = (
  cells: ArrayLike<number>,
  stone: Stone,
  limits: SearchLimits = DEFAULT_LIMITS,
): SearchResult => {
  const started = performance.now();
  const targetDepth = Math.max(0, Math.min(MAX_DEPTH, Math.floor(limits.maxDepth)));
  const pos = createPosition(cells);
  const ctx: SearchContext = {
    pos,
    deadline: started + limits.budgetMs,
    nodes: 0,
    isExpired: false,
    table: new Map(),
    completedDepth: 0,
    deepestPly: 0,
    reason: 'target',
    history: new Int32Array(CELL_COUNT * 3),
  };
  const forcingStats = { deepestPly: 0 };
  const finish = (cell: number, reason: Exit): SearchResult => ({
    cell,
    stats: {
      reason,
      targetDepth,
      selectiveCap: MAX_PLY,
      completedDepth: ctx.completedDepth,
      nodes: ctx.nodes,
      searchPly: ctx.deepestPly,
      forcingPly: forcingStats.deepestPly,
      deepestPly: Math.max(ctx.deepestPly, forcingStats.deepestPly),
      elapsedMs: performance.now() - started,
    },
  });
  if (pos.stones === 0) return finish(CENTER_CELL, 'opening');
  const moves = rootMoves(ctx, stone);
  if (!moves.length) return finish(rankCandidates(pos, stone, 1)[0] ?? -1, 'no-candidate');
  if (ctx.reason === 'immediate-win') return finish(moves[0]!, ctx.reason);
  if (expired(ctx)) return finish(moves[0]!, 'timeout');
  if (moves.length === 1) return finish(moves[0]!, 'only-move');
  const forcingBudget = Math.min(FORCING_BUDGET_MS, limits.budgetMs * FORCING_BUDGET_RATIO);
  const forcing = findForcingMove(pos, stone, started + forcingBudget, forcingStats);
  if (forcing !== null) return finish(forcing, 'forcing-win');
  const ordered = deepen(ctx, stone, { moves, maxDepth: targetDepth });
  return finish(ordered[0]!, ctx.reason);
};

export const chooseMove = (cells: ArrayLike<number>, stone: Stone, limits: SearchLimits = DEFAULT_LIMITS): number =>
  searchMove(cells, stone, limits).cell;
