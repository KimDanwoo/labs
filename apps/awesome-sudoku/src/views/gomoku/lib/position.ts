import { ATTACK_WEIGHT, DEFEND_WEIGHT, MOVER_EDGE, WINDOW_WEIGHT } from '@views/gomoku/config/ai';
import { CELL_COUNT, STONE, WIN_LENGTH } from '@views/gomoku/config/board';
import { rivalOf } from '@views/gomoku/lib/coords';
import { isForbidden } from '@views/gomoku/lib/forbidden';
import { NEAR, WINDOWS, WINDOWS_AT } from '@views/gomoku/lib/lines';
import { findWinLine } from '@views/gomoku/lib/winLine';
import type { Stone } from '@views/gomoku/model/types/gomoku';

export interface Position {
  cells: Uint8Array;
  near: Uint8Array;
  counts: readonly Uint8Array[];
  score: number[];
  fours: number[];
  openThrees: Set<number>[];
  stones: number;
  key: bigint;
  hash: number;
}

const MASKS = [0, 1, 2].map((stone) =>
  Array.from({ length: CELL_COUNT }, (_, cell) => BigInt(stone) << BigInt(cell * 2)),
);
const HASHES = [0, 1, 2].map((stone) =>
  Array.from({ length: CELL_COUNT }, (_, cell) => {
    let value = (stone * CELL_COUNT + cell + 1) | 0;
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
    return value ^ (value >>> 16);
  }),
);

const FOUR = WIN_LENGTH - 1;

const isFour = (count: number): number => (count === FOUR ? 1 : 0);

const shiftWindow = (pos: Position, window: number, stone: Stone, delta: 1 | -1): void => {
  const rival = rivalOf(stone);
  const before = pos.counts[stone]![window]!;
  const after = before + delta;
  pos.counts[stone]![window] = after;
  const rivalCount = pos.counts[rival]![window]!;
  if (rivalCount === 0) {
    if (before === FOUR - 1) pos.openThrees[stone]!.delete(window);
    if (after === FOUR - 1) pos.openThrees[stone]!.add(window);
    pos.score[stone]! += WINDOW_WEIGHT[after]! - WINDOW_WEIGHT[before]!;
    pos.fours[stone]! += isFour(after) - isFour(before);
    return;
  }
  const isStillBlocked = before !== 0 && after !== 0;
  if (isStillBlocked) return;
  const revive = after === 0 ? 1 : -1;
  if (rivalCount === FOUR - 1) {
    if (after === 0) pos.openThrees[rival]!.add(window);
    else pos.openThrees[rival]!.delete(window);
  }
  pos.score[rival]! += revive * WINDOW_WEIGHT[rivalCount]!;
  pos.fours[rival]! += revive * isFour(rivalCount);
};

export const shift = (pos: Position, cell: number, stone: Stone, delta: 1 | -1): void => {
  pos.key ^= MASKS[stone]![cell]!;
  pos.hash ^= HASHES[stone]![cell]!;
  pos.cells[cell] = delta === 1 ? stone : STONE.EMPTY;
  pos.stones += delta;
  for (const window of WINDOWS_AT[cell]!) shiftWindow(pos, window, stone, delta);
  for (const neighbor of NEAR[cell]!) pos.near[neighbor]! += delta;
};

export const createPosition = (cells: ArrayLike<number>): Position => {
  const pos: Position = {
    cells: new Uint8Array(CELL_COUNT),
    near: new Uint8Array(CELL_COUNT),
    counts: [new Uint8Array(0), new Uint8Array(WINDOWS.length), new Uint8Array(WINDOWS.length)],
    score: [0, 0, 0],
    fours: [0, 0, 0],
    openThrees: [new Set(), new Set(), new Set()],
    stones: 0,
    key: 0n,
    hash: 0,
  };
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const stone = cells[cell];
    const isStone = stone === STONE.BLACK || stone === STONE.WHITE;
    if (isStone) shift(pos, cell, stone, 1);
  }
  return pos;
};

export const completionCells = (pos: Position, stone: Stone): number[] => {
  const own = pos.counts[stone]!;
  const other = pos.counts[rivalOf(stone)]!;
  const found = new Set<number>();
  WINDOWS.forEach((cells, window) => {
    const isOpenFour = own[window] === FOUR && other[window] === 0;
    if (!isOpenFour) return;
    const gap = cells.find((cell) => pos.cells[cell] === STONE.EMPTY);
    if (gap !== undefined) found.add(gap);
  });
  return [...found].filter((cell) => {
    pos.cells[cell] = stone;
    const hasWin = findWinLine(pos.cells, cell) !== null;
    pos.cells[cell] = STONE.EMPTY;
    return hasWin;
  });
};

export const hasCompletion = (pos: Position, stone: Stone): boolean => {
  if (pos.fours[stone]! === 0) return false;
  return stone === STONE.WHITE || completionCells(pos, stone).length > 0;
};

const cellScore = (pos: Position, cell: number, stone: Stone): number => {
  const own = pos.counts[stone]!;
  const other = pos.counts[rivalOf(stone)]!;
  let score = 0;
  for (const window of WINDOWS_AT[cell]!) {
    const mine = own[window]!;
    const theirs = other[window]!;
    if (theirs === 0) score += ATTACK_WEIGHT[mine]!;
    if (mine === 0) score += DEFEND_WEIGHT[theirs]!;
  }
  return score;
};

export const forcingCandidates = (pos: Position, stone: Stone): number[] => {
  const found = new Set<number>();
  const three = FOUR - 1;
  WINDOWS.forEach((cells, window) => {
    const canForce = pos.counts[stone]![window] === three && pos.counts[rivalOf(stone)]![window] === 0;
    if (!canForce) return;
    cells.filter((cell) => pos.cells[cell] === STONE.EMPTY).forEach((cell) => found.add(cell));
  });
  return [...found]
    .sort((a, b) => cellScore(pos, b, stone) - cellScore(pos, a, stone))
    .filter((cell) => !isForbidden(pos.cells, cell, stone));
};

export const rankCandidates = (pos: Position, stone: Stone, width: number): number[] => {
  const ranked: number[] = [];
  for (let cell = 0; cell < CELL_COUNT; cell += 1) {
    const isCandidate = pos.cells[cell] === STONE.EMPTY && pos.near[cell] !== 0;
    if (!isCandidate) continue;
    ranked.push(cellScore(pos, cell, stone) * CELL_COUNT + cell);
  }
  ranked.sort((a, b) => b - a);
  const picked: number[] = [];
  for (const packed of ranked) {
    if (picked.length === width) break;
    const cell = packed % CELL_COUNT;
    if (!isForbidden(pos.cells, cell, stone)) picked.push(cell);
  }
  return picked;
};

export const evaluate = (pos: Position, stone: Stone): number =>
  pos.score[stone]! * MOVER_EDGE - pos.score[rivalOf(stone)]!;

export const hasUnblockableFour = (pos: Position, stone: Stone): boolean => {
  const rival = rivalOf(stone);
  if (pos.openThrees[stone]!.size < 2) return false;
  const candidates = new Set<number>();
  for (const window of pos.openThrees[stone]!) {
    for (const cell of WINDOWS[window]!) if (pos.cells[cell] === STONE.EMPTY) candidates.add(cell);
  }
  return [...candidates].some((cell) => {
    const gaps = new Set<number>();
    for (const window of WINDOWS_AT[cell]!) {
      if (pos.counts[stone]![window] !== FOUR - 1 || pos.counts[rival]![window] !== 0) continue;
      const gap = WINDOWS[window]!.find((other) => other !== cell && pos.cells[other] === STONE.EMPTY);
      if (gap !== undefined) gaps.add(gap);
    }
    if (gaps.size < 2 || isForbidden(pos.cells, cell, stone)) return false;
    shift(pos, cell, stone, 1);
    try {
      return !hasCompletion(pos, rival) && completionCells(pos, stone).length >= 2;
    } finally {
      shift(pos, cell, stone, -1);
    }
  });
};
