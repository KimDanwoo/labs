import { BLOCK_SIZE, BOARD_SIZE } from '@entities/sudoku/config/board';
import type { LogicBoard, LogicCage } from '@entities/sudoku/lib/logic/logicBoard';
import { ALL_DIGITS, bit, COL_UNITS, digitsOf, EMPTY, PEERS, ROW_UNITS, UNITS } from '@entities/sudoku/lib/solverGrid';

const UNIT_SUM = 45;

const REGIONS: number[][] = (() => {
  const pairs = (lines: number[][]): number[][] => lines.slice(0, -1).map((line, k) => [...line, ...lines[k + 1]!]);
  const triples = (lines: number[][]): number[][] =>
    [0, 3, 6].map((start) => lines.slice(start, start + BLOCK_SIZE).flat());
  return [...UNITS, ...pairs(ROW_UNITS), ...pairs(COL_UNITS), ...triples(ROW_UNITS), ...triples(COL_UNITS)];
})();

export function createCageTechniques({ cells, cands, cageInfos, place, eliminate }: LogicBoard) {
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

  const restrictPairSum = ([a, b]: number[], sum: number): boolean => {
    const seeEachOther = PEERS[a!]!.includes(b!);
    const fits = (partner: number, d: number): boolean => {
      const other = sum - d;
      return (
        other >= 1 && other <= BOARD_SIZE && (cands[partner]! & bit(other)) !== 0 && !(seeEachOther && other === d)
      );
    };
    const maskA = digitsOf(cands[a!]!).reduce((m, d) => (fits(b!, d) ? m | bit(d) : m), 0);
    const maskB = digitsOf(cands[b!]!).reduce((m, d) => (fits(a!, d) ? m | bit(d) : m), 0);
    return eliminate([a!], ALL_DIGITS & ~maskA) || eliminate([b!], ALL_DIGITS & ~maskB);
  };

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

  return { cageCombinations, cageLocked, innieOutie };
}
