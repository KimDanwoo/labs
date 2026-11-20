import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@entities/sudoku/config/board';
import { atIndex } from '@entities/sudoku/lib/gridAccess';
import type { LogicBoard } from '@entities/sudoku/lib/logic/logicBoard';
import {
  bit,
  COL_UNITS,
  combinations,
  EMPTY,
  PEERS,
  popcount,
  ROW_UNITS,
  UNITS,
} from '@entities/sudoku/lib/solverGrid';

const MAX_FISH_SIZE = 3;

type FishLine = { line: number[]; spots: number[] };

const FISH_ORIENTATIONS = [
  [ROW_UNITS, COL_UNITS],
  [COL_UNITS, ROW_UNITS],
] as const;

const CELL_INDEXES = Array.from({ length: SUDOKU_CELL_COUNT }, (_, i) => i);

export function createAdvancedTechniques({ cells, cands, openSpots, eliminate, hasCandidate }: LogicBoard) {
  const eliminateFish = (chosen: FishLine[], covers: readonly number[][], d: number): boolean => {
    const coverIndexes = new Set(chosen.flatMap(({ line, spots }) => spots.map((i) => line.indexOf(i))));
    if (coverIndexes.size !== chosen.length) return false;
    const baseCells = new Set(chosen.flatMap(({ line }) => line));
    const targets = [...coverIndexes].flatMap((k) => covers[k]!.filter((i) => !baseCells.has(i)));
    return eliminate(targets, bit(d));
  };

  const fishForDigit = (bases: readonly number[][], covers: readonly number[][], d: number): boolean => {
    const candidateLines: FishLine[] = bases
      .map((line) => ({ line, spots: openSpots(line, d) }))
      .filter(({ spots }) => spots.length >= 2 && spots.length <= MAX_FISH_SIZE);

    let progressed = false;
    for (let size = 2; size <= MAX_FISH_SIZE; size++) {
      for (const chosen of combinations(candidateLines, size)) {
        progressed = eliminateFish(chosen, covers, d) || progressed;
      }
    }
    return progressed;
  };

  const fish = (): boolean => {
    let progressed = false;
    for (const [bases, covers] of FISH_ORIENTATIONS) {
      for (let d = 1; d <= BOARD_SIZE; d++) {
        progressed = fishForDigit(bases, covers, d) || progressed;
      }
    }
    return progressed;
  };

  const xyWing = (): boolean => {
    let progressed = false;
    const bivalue = (i: number): boolean => cells[i] === EMPTY && popcount(cands[i]!) === 2;
    for (let pivot = 0; pivot < SUDOKU_CELL_COUNT; pivot++) {
      if (!bivalue(pivot)) continue;
      const wings = PEERS[pivot]!.filter((i) => bivalue(i) && popcount(cands[i]! & cands[pivot]!) === 1);
      for (const pair of combinations(wings, 2)) {
        const a = atIndex(pair, 0);
        const b = atIndex(pair, 1);
        const sharedZ = atIndex(cands, a)! & atIndex(cands, b)! & ~cands[pivot]!;
        const coversPivot = ((atIndex(cands, a)! | atIndex(cands, b)!) & cands[pivot]!) === cands[pivot]!;
        if (popcount(sharedZ) !== 1 || !coversPivot) continue;
        const targets = atIndex(PEERS, a)!.filter((i) => i !== b && i !== pivot && atIndex(PEERS, b)!.includes(i));
        progressed = eliminate(targets, sharedZ) || progressed;
      }
    }
    return progressed;
  };

  const xyzWing = (): boolean => {
    let progressed = false;
    for (let pivot = 0; pivot < SUDOKU_CELL_COUNT; pivot++) {
      if (cells[pivot] !== EMPTY || popcount(cands[pivot]!) !== 3) continue;
      const wings = PEERS[pivot]!.filter(
        (i) => cells[i] === EMPTY && popcount(cands[i]!) === 2 && (cands[i]! & cands[pivot]!) === cands[i]!,
      );
      for (const pair of combinations(wings, 2)) {
        const a = atIndex(pair, 0);
        const b = atIndex(pair, 1);
        const sharedZ = atIndex(cands, a)! & atIndex(cands, b)!;
        if (popcount(sharedZ) !== 1 || (atIndex(cands, a)! | atIndex(cands, b)!) !== cands[pivot]!) continue;
        const targets = PEERS[pivot]!.filter(
          (i) => i !== a && i !== b && atIndex(PEERS, a)!.includes(i) && atIndex(PEERS, b)!.includes(i),
        );
        progressed = eliminate(targets, sharedZ) || progressed;
      }
    }
    return progressed;
  };

  const strongLinks = (d: number): Map<number, number[]> => {
    const links = new Map<number, number[]>();
    for (const unit of UNITS) {
      const spots = openSpots(unit, d);
      if (spots.length !== 2) continue;
      const [a, b] = spots as [number, number];
      links.set(a, [...(links.get(a) ?? []), b]);
      links.set(b, [...(links.get(b) ?? []), a]);
    }
    return links;
  };

  const paintCluster = (start: number, links: Map<number, number[]>, color: Map<number, number>): number[] => {
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
    return cluster;
  };

  const seesAny = (i: number, group: number[]): boolean => group.some((j) => PEERS[i]!.includes(j));

  const eliminateByColors = (cluster: number[], color: Map<number, number>, d: number): boolean => {
    const byColor = [cluster.filter((i) => color.get(i) === 0), cluster.filter((i) => color.get(i) === 1)];
    const falseColor = byColor.findIndex((group) => group.some((i, k) => seesAny(i, group.slice(k + 1))));
    if (falseColor !== -1) return eliminate(byColor[falseColor]!, bit(d));

    const targets = CELL_INDEXES.filter(
      (i) => hasCandidate(i, d) && !color.has(i) && seesAny(i, byColor[0]!) && seesAny(i, byColor[1]!),
    );
    return eliminate(targets, bit(d));
  };

  const simpleColoring = (): boolean => {
    let progressed = false;
    for (let d = 1; d <= BOARD_SIZE; d++) {
      const links = strongLinks(d);
      const color = new Map<number, number>();
      for (const start of links.keys()) {
        if (color.has(start)) continue;
        const cluster = paintCluster(start, links, color);
        if (cluster.length < 3) continue;
        progressed = eliminateByColors(cluster, color, d) || progressed;
      }
    }
    return progressed;
  };

  return { fish, xyWing, xyzWing, simpleColoring };
}
