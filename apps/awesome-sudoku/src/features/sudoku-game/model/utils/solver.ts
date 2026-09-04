import { BLOCK_SIZE, BOARD_SIZE, SUDOKU_CELL_COUNT } from '@entities/board/model/constants';
import type { Grid } from '@entities/board/model/types';
import { TECHNIQUE } from '@entities/game/model/constants';
import type { KillerCage, Technique } from '@entities/game/model/types';
import { createEmptyGrid, shuffleArray } from './common';

/** 후보는 비트마스크로 다룬다: 숫자 d ↔ 비트 (1 << d). 0번 비트는 쓰지 않는다. */
const ALL_DIGITS = 0b1111111110;
const EMPTY = 0;

const bit = (digit: number): number => 1 << digit;

const popcount = (mask: number): number => {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count++;
  return count;
};

const digitsOf = (mask: number): number[] => {
  const digits: number[] = [];
  for (let d = 1; d <= BOARD_SIZE; d++) if (mask & bit(d)) digits.push(d);
  return digits;
};

const rowOf = (index: number): number => Math.floor(index / BOARD_SIZE);
const colOf = (index: number): number => index % BOARD_SIZE;
const boxOf = (index: number): number =>
  Math.floor(rowOf(index) / BLOCK_SIZE) * BLOCK_SIZE + Math.floor(colOf(index) / BLOCK_SIZE);

/** 27개 유닛(행 9 · 열 9 · 박스 9)의 셀 인덱스 */
const UNITS: number[][] = (() => {
  const rows = Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => r * BOARD_SIZE + c),
  );
  const cols = Array.from({ length: BOARD_SIZE }, (_, c) =>
    Array.from({ length: BOARD_SIZE }, (_, r) => r * BOARD_SIZE + c),
  );
  const boxes = Array.from({ length: BOARD_SIZE }, (_, b) => {
    const baseRow = Math.floor(b / BLOCK_SIZE) * BLOCK_SIZE;
    const baseCol = (b % BLOCK_SIZE) * BLOCK_SIZE;
    return Array.from(
      { length: BOARD_SIZE },
      (_, i) => (baseRow + Math.floor(i / BLOCK_SIZE)) * BOARD_SIZE + baseCol + (i % BLOCK_SIZE),
    );
  });
  return [...rows, ...cols, ...boxes];
})();

const ROW_UNITS = UNITS.slice(0, BOARD_SIZE);
const COL_UNITS = UNITS.slice(BOARD_SIZE, BOARD_SIZE * 2);
const BOX_UNITS = UNITS.slice(BOARD_SIZE * 2);

/** 셀별 피어(같은 행·열·박스의 나머지 20칸) */
const PEERS: number[][] = Array.from({ length: SUDOKU_CELL_COUNT }, (_, i) => {
  const peers = new Set<number>();
  for (const unit of [ROW_UNITS[rowOf(i)]!, COL_UNITS[colOf(i)]!, BOX_UNITS[boxOf(i)]!])
    unit.forEach((p) => peers.add(p));
  peers.delete(i);
  return [...peers];
});

const flatten = (grid: Grid): number[] => grid.flat();

const unflatten = (cells: number[]): Grid => {
  const grid = createEmptyGrid();
  cells.forEach((v, i) => {
    grid[rowOf(i)]![colOf(i)] = v;
  });
  return grid;
};

// ── 킬러 케이지 제약 ──────────────────────────────────────────

/** (크기, 합)별로 가능한 숫자 조합(비트마스크) 목록. 케이지 하나가 가질 수 있는 숫자 집합은 이 중 하나다. */
const cageCombosCache = new Map<string, number[]>();

const cageCombos = (size: number, sum: number): number[] => {
  const cacheKey = `${size}-${sum}`;
  const cached = cageCombosCache.get(cacheKey);
  if (cached) return cached;

  const combos: number[] = [];
  const build = (nextDigit: number, mask: number, count: number, total: number): void => {
    if (count === size) {
      if (total === sum) combos.push(mask);
      return;
    }
    for (let d = nextDigit; d <= BOARD_SIZE; d++) build(d + 1, mask | bit(d), count + 1, total + d);
  };
  build(1, 0, 0, 0);
  cageCombosCache.set(cacheKey, combos);
  return combos;
};

type CageState = {
  combos: number[];
  usedMask: number;
  /** usedMask → 아직 놓을 수 있는 숫자 마스크 (조합 중 usedMask를 포함하는 것들의 합집합에서 usedMask를 뺀 것) */
  allowedCache: Map<number, number>;
};

const cageAllowedMask = (cage: CageState): number => {
  const cached = cage.allowedCache.get(cage.usedMask);
  if (cached !== undefined) return cached;

  let allowed = 0;
  for (const combo of cage.combos) if ((combo & cage.usedMask) === cage.usedMask) allowed |= combo;
  allowed &= ~cage.usedMask;
  cage.allowedCache.set(cage.usedMask, allowed);
  return allowed;
};

// ── 백트래킹 탐색 ─────────────────────────────────────────────

type SearchOptions = {
  limit: number;
  randomize: boolean;
  cages?: KillerCage[];
  /** 방문 노드 상한. 넘기면 exhausted=true로 중단한다 — 힌트가 거의 없는 킬러 판에서 탐색이 폭발하는 것을 막는다. */
  nodeBudget?: number;
  /** 이 칸에는 이 숫자를 놓지 않는다 — "원래 값이 아닌 다른 해"가 있는지 찾을 때 쓴다 */
  exclude?: { index: number; digit: number };
};

type SearchResult = { count: number; solution: number[] | null; exhausted: boolean };

function search(
  initial: number[],
  { limit, randomize, cages, nodeBudget = Number.POSITIVE_INFINITY, exclude }: SearchOptions,
): SearchResult {
  const cells = [...initial];
  const rowUsed = new Array<number>(BOARD_SIZE).fill(0);
  const colUsed = new Array<number>(BOARD_SIZE).fill(0);
  const boxUsed = new Array<number>(BOARD_SIZE).fill(0);
  const cageOf = new Array<number>(SUDOKU_CELL_COUNT).fill(-1);
  const cageStates: CageState[] = [];

  cages?.forEach((cage, cageIndex) => {
    cage.cells.forEach(([r, c]) => {
      cageOf[r * BOARD_SIZE + c] = cageIndex;
    });
    cageStates.push({ combos: cageCombos(cage.cells.length, cage.sum), usedMask: 0, allowedCache: new Map() });
  });

  cells.forEach((v, i) => {
    if (v === EMPTY) return;
    rowUsed[rowOf(i)]! |= bit(v);
    colUsed[colOf(i)]! |= bit(v);
    boxUsed[boxOf(i)]! |= bit(v);
    const cage = cageStates[cageOf[i]!];
    if (cage) cage.usedMask |= bit(v);
  });

  // 주어진 칸이 어떤 조합에도 맞지 않는 케이지(합 불일치·중복)는 해가 없다 — 탐색은 빈 칸에서만 케이지를 본다
  const isInconsistent = cageStates.some(
    (cage) => !cage.combos.some((combo) => (combo & cage.usedMask) === cage.usedMask),
  );
  if (isInconsistent) return { count: 0, solution: null, exhausted: false };

  const candidatesOf = (i: number): number => {
    let mask = ALL_DIGITS & ~(rowUsed[rowOf(i)]! | colUsed[colOf(i)]! | boxUsed[boxOf(i)]!);
    if (exclude && exclude.index === i) mask &= ~bit(exclude.digit);
    const cage = cageStates[cageOf[i]!];
    return cage ? mask & cageAllowedMask(cage) : mask;
  };

  const place = (i: number, v: number, on: boolean): void => {
    const b = bit(v);
    if (on) {
      cells[i] = v;
      rowUsed[rowOf(i)]! |= b;
      colUsed[colOf(i)]! |= b;
      boxUsed[boxOf(i)]! |= b;
    } else {
      cells[i] = EMPTY;
      rowUsed[rowOf(i)]! &= ~b;
      colUsed[colOf(i)]! &= ~b;
      boxUsed[boxOf(i)]! &= ~b;
    }
    const cage = cageStates[cageOf[i]!];
    if (!cage) return;
    if (on) cage.usedMask |= b;
    else cage.usedMask &= ~b;
  };

  let count = 0;
  let nodes = 0;
  let exhausted = false;
  let solution: number[] | null = null;

  const step = (): boolean => {
    if (++nodes > nodeBudget) {
      exhausted = true;
      return true;
    }

    let bestCell = -1;
    let bestMask = 0;
    let bestSize = BOARD_SIZE + 1;

    for (let i = 0; i < SUDOKU_CELL_COUNT; i++) {
      if (cells[i] !== EMPTY) continue;
      const mask = candidatesOf(i);
      const size = popcount(mask);
      if (size === 0) return false;
      if (size < bestSize) {
        bestSize = size;
        bestMask = mask;
        bestCell = i;
        if (size === 1) break;
      }
    }

    if (bestCell === -1) {
      count++;
      solution ??= [...cells];
      return count >= limit;
    }

    const digits = digitsOf(bestMask);
    if (randomize) shuffleArray(digits);

    for (const d of digits) {
      place(bestCell, d, true);
      const done = step();
      place(bestCell, d, false);
      if (done) return true;
    }
    return false;
  };

  step();
  return { count, solution, exhausted };
}

/**
 * @description 해의 개수를 limit까지 센다 (limit=2면 유일해 판정용). 0은 빈 칸.
 * 노드 예산을 넘겨 판정을 못 하면 limit을 돌려준다(유일하지 않은 것으로 간주 — 안전한 쪽).
 */
export function countSolutions(grid: Grid, limit: number, cages?: KillerCage[], nodeBudget?: number): number {
  const { count, exhausted } = search(flatten(grid), { limit, randomize: false, cages, nodeBudget });
  return exhausted ? limit : count;
}

export const hasUniqueSolution = (grid: Grid, cages?: KillerCage[], nodeBudget?: number): boolean =>
  countSolutions(grid, 2, cages, nodeBudget) === 1;

/**
 * @description 유일해였던 퍼즐에서 (row, col)을 비웠을 때도 유일한가 — 그 칸에 원래 값이 아닌 값을 넣은 해가 없어야 한다.
 * 해를 둘까지 세는 것보다 싸다: 이미 아는 해를 다시 찾지 않고 대안만 찾는다. 예산을 넘기면 유일하지 않은 것으로 본다.
 */
export function staysUniqueWithout(
  grid: Grid,
  [row, col]: [number, number],
  originalValue: number,
  cages?: KillerCage[],
  nodeBudget?: number,
): boolean {
  const cells = flatten(grid);
  const index = row * BOARD_SIZE + col;
  cells[index] = EMPTY;
  const { count, exhausted } = search(cells, {
    limit: 1,
    randomize: false,
    cages,
    nodeBudget,
    exclude: { index, digit: originalValue },
  });
  return !exhausted && count === 0;
}

/**
 * @description 무작위 완성 그리드 생성 — 빈 판을 후보 순서를 섞어 채운다.
 */
export function generateRandomSolution(): Grid {
  const { solution } = search(flatten(createEmptyGrid()), { limit: 1, randomize: true });
  if (!solution) throw new Error('빈 스도쿠 판을 채우지 못했습니다');
  return unflatten(solution);
}

// ── 사람 기법 기반 채점 ───────────────────────────────────────

function* combinations<T>(items: T[], size: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === size) {
    yield acc;
    return;
  }
  for (let i = start; i <= items.length - (size - acc.length); i++) {
    yield* combinations(items, size, i + 1, [...acc, items[i]!]);
  }
}

const MAX_SUBSET_SIZE = 4;
const MAX_HIDDEN_SUBSET_SIZE = 3;
const MAX_FISH_SIZE = 3;
const UNIT_SUM = 45;

type LogicCage = { cells: number[]; sum: number; combos: number[] };

/** 45 규칙을 적용할 영역: 유닛 27개 + 인접한 두 줄 + 밴드/스택(세 줄) */
const REGIONS: number[][] = (() => {
  const pairs = (lines: number[][]): number[][] => lines.slice(0, -1).map((line, k) => [...line, ...lines[k + 1]!]);
  const triples = (lines: number[][]): number[][] =>
    [0, 3, 6].map((start) => lines.slice(start, start + BLOCK_SIZE).flat());
  return [...UNITS, ...pairs(ROW_UNITS), ...pairs(COL_UNITS), ...triples(ROW_UNITS), ...triples(COL_UNITS)];
})();

/**
 * @description 퍼즐을 사람 기법으로 푼다. 싱글(네이키드·히든) → 락드 캔디데이트 → 네이키드 서브셋(2~4) 순으로 시도하고,
 * 어느 것도 진전이 없으면 GUESS(추측 필요)로 멈춘다. grid는 그 시점까지 놓인 값(0은 빈 칸).
 */
export function solveLogically(grid: Grid, cages: KillerCage[] = []): { technique: Technique; grid: Grid } {
  const cells = flatten(grid);
  const cands = new Array<number>(SUDOKU_CELL_COUNT).fill(ALL_DIGITS);

  const place = (i: number, v: number): void => {
    cells[i] = v;
    cands[i] = 0;
    for (const p of PEERS[i]!) cands[p]! &= ~bit(v);
  };

  const cageInfos: LogicCage[] = cages.map((cage) => ({
    cells: cage.cells.map(([r, c]) => r * BOARD_SIZE + c),
    sum: cage.sum,
    combos: cageCombos(cage.cells.length, cage.sum),
  }));
  const cageOfCell = new Array<LogicCage | undefined>(SUDOKU_CELL_COUNT).fill(undefined);
  cageInfos.forEach((cage) => cage.cells.forEach((i) => (cageOfCell[i] = cage)));

  cells.forEach((v, i) => {
    if (v !== EMPTY) place(i, v);
  });

  const isSolved = (): boolean => cells.every((v) => v !== EMPTY);

  const nakedSingles = (): boolean => {
    let progressed = false;
    for (let i = 0; i < SUDOKU_CELL_COUNT; i++) {
      if (cells[i] !== EMPTY || popcount(cands[i]!) !== 1) continue;
      place(i, digitsOf(cands[i]!)[0]!);
      progressed = true;
    }
    return progressed;
  };

  const hiddenSingles = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      for (let d = 1; d <= BOARD_SIZE; d++) {
        const spots = unit.filter((i) => cells[i] === EMPTY && cands[i]! & bit(d));
        if (spots.length !== 1) continue;
        place(spots[0]!, d);
        progressed = true;
      }
    }
    return progressed;
  };

  const eliminate = (targets: number[], mask: number): boolean => {
    let progressed = false;
    for (const i of targets) {
      if (cells[i] !== EMPTY || (cands[i]! & mask) === 0) continue;
      cands[i]! &= ~mask;
      progressed = true;
    }
    return progressed;
  };

  /** 박스 안에서 한 줄에 갇힌 숫자는 그 줄의 다른 박스에서 지우고(pointing), 줄 안에서 한 박스에 갇힌 숫자는 그 박스의 다른 줄에서 지운다(claiming). */
  const lockedCandidates = (): boolean => {
    let progressed = false;
    const lines = [...ROW_UNITS, ...COL_UNITS];

    for (let d = 1; d <= BOARD_SIZE; d++) {
      for (const box of BOX_UNITS) {
        const spots = box.filter((i) => cells[i] === EMPTY && cands[i]! & bit(d));
        if (spots.length < 2) continue;
        for (const line of lines) {
          if (!spots.every((i) => line.includes(i))) continue;
          progressed =
            eliminate(
              line.filter((i) => !box.includes(i)),
              bit(d),
            ) || progressed;
        }
      }
      for (const line of lines) {
        const spots = line.filter((i) => cells[i] === EMPTY && cands[i]! & bit(d));
        if (spots.length < 2) continue;
        for (const box of BOX_UNITS) {
          if (!spots.every((i) => box.includes(i))) continue;
          progressed =
            eliminate(
              box.filter((i) => !line.includes(i)),
              bit(d),
            ) || progressed;
        }
      }
    }
    return progressed;
  };

  /** 유닛 안의 k칸이 정확히 k개 후보만 공유하면 나머지 칸에서 그 후보를 지운다. */
  const nakedSubsets = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      const empty = unit.filter((i) => cells[i] === EMPTY);
      for (let size = 2; size <= MAX_SUBSET_SIZE && size < empty.length; size++) {
        for (const subset of combinations(empty, size)) {
          const union = subset.reduce((m, i) => m | cands[i]!, 0);
          if (popcount(union) !== size) continue;
          const others = empty.filter((i) => !subset.includes(i));
          progressed = eliminate(others, union) || progressed;
        }
      }
    }
    return progressed;
  };

  /** 유닛 안에서 k개 숫자가 정확히 k칸에만 올 수 있으면 그 칸들의 다른 후보를 지운다. */
  const hiddenSubsets = (): boolean => {
    let progressed = false;
    for (const unit of UNITS) {
      const empty = unit.filter((i) => cells[i] === EMPTY);
      const missing = digitsOf(empty.reduce((m, i) => m | cands[i]!, 0));
      for (let size = 2; size <= MAX_HIDDEN_SUBSET_SIZE && size < missing.length; size++) {
        for (const digits of combinations(missing, size)) {
          const mask = digits.reduce((m, d) => m | bit(d), 0);
          const spots = empty.filter((i) => cands[i]! & mask);
          if (spots.length !== size) continue;
          progressed = eliminate(spots, ALL_DIGITS & ~mask) || progressed;
        }
      }
    }
    return progressed;
  };

  /** X-Wing(2)·Swordfish(3): 숫자 d가 k개 줄에서 합쳐 k개 칸(교차 줄)에만 오면 그 교차 줄의 다른 칸에서 d를 지운다. */
  const fish = (): boolean => {
    let progressed = false;
    const lineIndex = (unit: number[], i: number): number => unit.indexOf(i);
    for (const [bases, covers] of [
      [ROW_UNITS, COL_UNITS],
      [COL_UNITS, ROW_UNITS],
    ] as const) {
      for (let d = 1; d <= BOARD_SIZE; d++) {
        const candidateLines = bases
          .map((line) => ({ line, spots: line.filter((i) => cells[i] === EMPTY && cands[i]! & bit(d)) }))
          .filter(({ spots }) => spots.length >= 2 && spots.length <= MAX_FISH_SIZE);
        for (let size = 2; size <= MAX_FISH_SIZE; size++) {
          for (const chosen of combinations(candidateLines, size)) {
            const coverIndexes = new Set(chosen.flatMap(({ line, spots }) => spots.map((i) => lineIndex(line, i))));
            if (coverIndexes.size !== size) continue;
            const baseCells = new Set(chosen.flatMap(({ line }) => line));
            const targets = [...coverIndexes].flatMap((k) => covers[k]!.filter((i) => !baseCells.has(i)));
            progressed = eliminate(targets, bit(d)) || progressed;
          }
        }
      }
    }
    return progressed;
  };

  /** XY-Wing: 후보 {x,y} 피벗과 그것을 보는 {x,z}·{y,z} 두 날개가 있으면, 두 날개를 모두 보는 칸에서 z를 지운다. */
  const xyWing = (): boolean => {
    let progressed = false;
    const bivalue = (i: number): boolean => cells[i] === EMPTY && popcount(cands[i]!) === 2;
    for (let pivot = 0; pivot < SUDOKU_CELL_COUNT; pivot++) {
      if (!bivalue(pivot)) continue;
      const wings = PEERS[pivot]!.filter((i) => bivalue(i) && popcount(cands[i]! & cands[pivot]!) === 1);
      for (const [a, b] of combinations(wings, 2)) {
        const sharedZ = cands[a]! & cands[b]! & ~cands[pivot]!;
        const coversPivot = ((cands[a]! | cands[b]!) & cands[pivot]!) === cands[pivot]!;
        if (popcount(sharedZ) !== 1 || !coversPivot) continue;
        const targets = PEERS[a]!.filter((i) => i !== b && i !== pivot && PEERS[b]!.includes(i));
        progressed = eliminate(targets, sharedZ) || progressed;
      }
    }
    return progressed;
  };

  /** XYZ-Wing: 후보 {x,y,z} 피벗과 그것을 보는 {x,z}·{y,z} 두 날개가 있으면, 셋을 모두 보는 칸에서 z를 지운다. */
  const xyzWing = (): boolean => {
    let progressed = false;
    for (let pivot = 0; pivot < SUDOKU_CELL_COUNT; pivot++) {
      if (cells[pivot] !== EMPTY || popcount(cands[pivot]!) !== 3) continue;
      const wings = PEERS[pivot]!.filter(
        (i) => cells[i] === EMPTY && popcount(cands[i]!) === 2 && (cands[i]! & cands[pivot]!) === cands[i]!,
      );
      for (const [a, b] of combinations(wings, 2)) {
        const sharedZ = cands[a]! & cands[b]!;
        if (popcount(sharedZ) !== 1 || (cands[a]! | cands[b]!) !== cands[pivot]!) continue;
        const targets = PEERS[pivot]!.filter(
          (i) => i !== a && i !== b && PEERS[a]!.includes(i) && PEERS[b]!.includes(i),
        );
        progressed = eliminate(targets, sharedZ) || progressed;
      }
    }
    return progressed;
  };

  /**
   * 단일 숫자 컬러링: 어떤 숫자가 정확히 두 칸에만 오는 유닛들을 강한 연결로 이어 두 색으로 칠한다.
   * 같은 색 두 칸이 한 유닛에 있으면 그 색은 거짓, 두 색을 모두 보는 칸에서는 그 숫자를 지운다.
   * (Skyscraper · 2-String Kite · Turbot Fish를 포괄한다)
   */
  const simpleColoring = (): boolean => {
    let progressed = false;
    for (let d = 1; d <= BOARD_SIZE; d++) {
      const has = (i: number): boolean => cells[i] === EMPTY && (cands[i]! & bit(d)) !== 0;
      const links = new Map<number, number[]>();
      for (const unit of UNITS) {
        const spots = unit.filter(has);
        if (spots.length !== 2) continue;
        const [a, b] = spots as [number, number];
        links.set(a, [...(links.get(a) ?? []), b]);
        links.set(b, [...(links.get(b) ?? []), a]);
      }

      const color = new Map<number, number>();
      for (const start of links.keys()) {
        if (color.has(start)) continue;
        const cluster: number[] = [];
        const stack = [start];
        color.set(start, 0);
        while (stack.length > 0) {
          const i = stack.pop()!;
          cluster.push(i);
          for (const j of links.get(i)!) {
            if (color.has(j)) continue;
            color.set(j, 1 - color.get(i)!);
            stack.push(j);
          }
        }
        if (cluster.length < 3) continue;

        const byColor = [cluster.filter((i) => color.get(i) === 0), cluster.filter((i) => color.get(i) === 1)];
        // 같은 색끼리 서로 보이면 그 색은 거짓
        const falseColor = byColor.findIndex((group) =>
          group.some((i, k) => group.slice(k + 1).some((j) => PEERS[i]!.includes(j))),
        );
        if (falseColor !== -1) {
          progressed = eliminate(byColor[falseColor]!, bit(d)) || progressed;
          continue;
        }
        // 두 색을 모두 보는 바깥 칸에서 지운다
        const seesColor = (i: number, group: number[]): boolean => group.some((j) => PEERS[i]!.includes(j));
        const targets: number[] = [];
        for (let i = 0; i < SUDOKU_CELL_COUNT; i++) {
          if (!has(i) || color.has(i)) continue;
          if (seesColor(i, byColor[0]!) && seesColor(i, byColor[1]!)) targets.push(i);
        }
        progressed = eliminate(targets, bit(d)) || progressed;
      }
    }
    return progressed;
  };

  // ── 킬러 기법 ──

  /** 케이지의 남은 칸에 실제로 놓을 수 있는 조합들(놓인 숫자를 포함하고, 남은 숫자마다 갈 칸이 있는 것) */
  const feasibleCombos = (cage: LogicCage): { placed: number; remaining: number[]; empty: number[] } => {
    const empty = cage.cells.filter((i) => cells[i] === EMPTY);
    const placed = cage.cells.reduce((m, i) => (cells[i] === EMPTY ? m : m | bit(cells[i]!)), 0);
    const remaining = cage.combos
      .filter((combo) => (combo & placed) === placed)
      .map((combo) => combo & ~placed)
      .filter((rest) => digitsOf(rest).every((d) => empty.some((i) => cands[i]! & bit(d))))
      .filter((rest) => empty.every((i) => (cands[i]! & rest) !== 0));
    return { placed, remaining, empty };
  };

  /** 케이지 조합: 어느 조합에도 없는 숫자를 지우고, 모든 조합에 있는 숫자가 한 칸에만 올 수 있으면 놓는다. */
  const cageCombinations = (): boolean => {
    let progressed = false;
    for (const cage of cageInfos) {
      const { remaining, empty } = feasibleCombos(cage);
      if (empty.length === 0 || remaining.length === 0) continue;
      const union = remaining.reduce((m, rest) => m | rest, 0);
      progressed = eliminate(empty, ALL_DIGITS & ~union) || progressed;

      const required = remaining.reduce((m, rest) => m & rest, ALL_DIGITS);
      for (const d of digitsOf(required)) {
        const spots = empty.filter((i) => cands[i]! & bit(d));
        if (spots.length !== 1 || cells[spots[0]!] !== EMPTY) continue;
        place(spots[0]!, d);
        progressed = true;
      }
    }
    return progressed;
  };

  /** 케이지 잠금: 케이지의 남은 칸이 한 유닛 안에 있으면, 반드시 들어가는 숫자를 그 유닛의 다른 칸에서 지운다. */
  const cageLocked = (): boolean => {
    let progressed = false;
    for (const cage of cageInfos) {
      const { remaining, empty } = feasibleCombos(cage);
      if (empty.length === 0 || remaining.length === 0) continue;
      const required = remaining.reduce((m, rest) => m & rest, ALL_DIGITS);
      if (required === 0) continue;
      for (const unit of UNITS) {
        if (!empty.every((i) => unit.includes(i))) continue;
        progressed =
          eliminate(
            unit.filter((i) => !empty.includes(i)),
            required,
          ) || progressed;
      }
    }
    return progressed;
  };

  /** 두 칸의 합이 S로 정해졌을 때 짝이 없는 후보를 지운다 */
  const restrictPairSum = ([a, b]: number[], sum: number): boolean => {
    const seeEachOther = PEERS[a!]!.includes(b!);
    const fits = (i: number, j: number, d: number): boolean => {
      const other = sum - d;
      return other >= 1 && other <= BOARD_SIZE && (cands[j]! & bit(other)) !== 0 && !(seeEachOther && other === d);
    };
    const maskA = digitsOf(cands[a!]!).reduce((m, d) => (fits(a!, b!, d) ? m | bit(d) : m), 0);
    const maskB = digitsOf(cands[b!]!).reduce((m, d) => (fits(b!, a!, d) ? m | bit(d) : m), 0);
    return eliminate([a!], ALL_DIGITS & ~maskA) || eliminate([b!], ALL_DIGITS & ~maskB);
  };

  /** 정해진 합 S를 미지의 칸들이 채워야 할 때: 1칸이면 놓고, 2칸이면 짝을 제한한다 */
  const applyKnownSum = (unknown: number[], sum: number): boolean => {
    if (unknown.length === 1) {
      const i = unknown[0]!;
      if (sum < 1 || sum > BOARD_SIZE || !(cands[i]! & bit(sum))) return false;
      place(i, sum);
      return true;
    }
    if (unknown.length === 2) return restrictPairSum(unknown, sum);
    return false;
  };

  /**
   * 45 규칙(innie/outie): 영역(유닛·인접 두 줄·밴드)의 합은 45×n. 영역 안에 완전히 든 케이지 합과 놓인 값을 빼면
   * 남은 미지 칸(innie)의 합이 나오고, 영역에 걸친 케이지 합을 더하면 바깥 미지 칸(outie)의 합이 나온다.
   */
  const innieOutie = (): boolean => {
    let progressed = false;
    for (const region of REGIONS) {
      const inRegion = new Set(region);
      const total = (region.length / BOARD_SIZE) * UNIT_SUM;
      const touching = cageInfos.filter((cage) => cage.cells.some((i) => inRegion.has(i)));
      const inside = touching.filter((cage) => cage.cells.every((i) => inRegion.has(i)));
      const partial = touching.filter((cage) => !inside.includes(cage));

      const insideSum = inside.reduce((t, cage) => t + cage.sum, 0);
      const partialCells = partial.flatMap((cage) => cage.cells);
      const innieCells = partialCells.filter((i) => inRegion.has(i));
      const outieCells = partialCells.filter((i) => !inRegion.has(i));
      const placedSum = (list: number[]): number => list.reduce((t, i) => t + (cells[i] === EMPTY ? 0 : cells[i]!), 0);

      const unknownInnies = innieCells.filter((i) => cells[i] === EMPTY);
      progressed = applyKnownSum(unknownInnies, total - insideSum - placedSum(innieCells)) || progressed;

      const partialSum = partial.reduce((t, cage) => t + cage.sum, 0);
      const unknownOuties = outieCells.filter((i) => cells[i] === EMPTY);
      progressed = applyKnownSum(unknownOuties, insideSum + partialSum - total - placedSum(outieCells)) || progressed;
    }
    return progressed;
  };

  const hasCages = cageInfos.length > 0;
  const ladder: Array<[Technique, () => boolean]> = [
    [TECHNIQUE.SINGLE, () => nakedSingles() || hiddenSingles() || (hasCages && cageCombinations())],
    [TECHNIQUE.LOCKED, () => lockedCandidates() || (hasCages && (cageLocked() || innieOutie()))],
    [TECHNIQUE.SUBSET, () => nakedSubsets() || hiddenSubsets()],
    [TECHNIQUE.ADVANCED, () => fish() || xyWing() || xyzWing() || simpleColoring()],
  ];

  let hardest: Technique = TECHNIQUE.SINGLE;

  while (!isSolved()) {
    const rung = ladder.find(([, apply]) => apply());
    if (!rung) return { technique: TECHNIQUE.GUESS, grid: unflatten(cells) };
    hardest = Math.max(hardest, rung[0]) as Technique;
  }

  return { technique: hardest, grid: unflatten(cells) };
}

/**
 * @description 퍼즐을 푸는 데 필요한 최고 기법
 */
export const gradePuzzle = (grid: Grid, cages: KillerCage[] = []): Technique => solveLogically(grid, cages).technique;
