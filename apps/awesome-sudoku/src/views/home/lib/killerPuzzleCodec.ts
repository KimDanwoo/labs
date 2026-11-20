import { BOARD_SIZE } from '../config/board';
import { CAGE_ALPHABET, EMPTY_GIVEN } from '../config/killerCage';
import type { Grid, GridPosition } from '../model/types/board';
import type { EncodedKillerPuzzle, KillerCage, KillerPuzzle } from '../model/types/game';
import { cellAt } from './gridAccess';

const EMPTY = 0;

const toGrid = (digits: string): Grid =>
  Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
      const digit = digits.charAt(row * BOARD_SIZE + col);
      return digit === EMPTY_GIVEN ? EMPTY : Number(digit);
    }),
  );

const positionOf = (index: number): GridPosition => [Math.floor(index / BOARD_SIZE), index % BOARD_SIZE];

function decodeCages(layout: string, solution: Grid): KillerCage[] {
  const cellsByKey = new Map<string, GridPosition[]>();
  [...layout].forEach((key, index) => cellsByKey.set(key, [...(cellsByKey.get(key) ?? []), positionOf(index)]));
  return [...cellsByKey.values()].map((cells, index) => ({
    id: index + 1,
    cells,
    sum: cells.reduce((total, [row, col]) => total + cellAt(solution, row, col), 0),
  }));
}

export function decodeKillerPuzzle({ solution, givens, cages }: EncodedKillerPuzzle): KillerPuzzle {
  const solutionGrid = toGrid(solution);
  return { solution: solutionGrid, puzzle: toGrid(givens), cages: decodeCages(cages, solutionGrid) };
}

function encodeCages(cages: readonly KillerCage[]): string {
  const layout = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => '');
  cages.forEach((cage, index) =>
    cage.cells.forEach(([row, col]) => (layout[row * BOARD_SIZE + col] = CAGE_ALPHABET.charAt(index))),
  );
  return layout.join('');
}

export const encodeKillerPuzzle = ({ solution, puzzle, cages }: KillerPuzzle): EncodedKillerPuzzle => ({
  solution: solution.flat().join(''),
  givens: puzzle
    .flat()
    .map((value) => (value === EMPTY ? EMPTY_GIVEN : String(value)))
    .join(''),
  cages: encodeCages(cages),
});
