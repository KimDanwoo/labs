import { BOARD_MAX_INDEX } from '@views/home/config/board';
import { atIndex } from '@views/home/lib/gridAccess';
import { createEmptyGrid } from '@views/home/model/services/common';
import type { Grid, GridPosition } from '@views/home/model/types/board';
import type { KillerPuzzle } from '@views/home/model/types/game';

export type GridMove = (position: GridPosition) => GridPosition;

interface GridSymmetry {
  isTransposed: boolean;
  isRowFlipped: boolean;
  isColFlipped: boolean;
}

export const gridMove =
  ({ isTransposed, isRowFlipped, isColFlipped }: GridSymmetry): GridMove =>
  ([row, col]) => {
    const flipped: GridPosition = [
      isRowFlipped ? BOARD_MAX_INDEX - row : row,
      isColFlipped ? BOARD_MAX_INDEX - col : col,
    ];
    return isTransposed ? [flipped[1], flipped[0]] : flipped;
  };

const coinFlip = (): boolean => Math.random() < 1 / 2;

export const randomGridMove = (): GridMove =>
  gridMove({ isTransposed: coinFlip(), isRowFlipped: coinFlip(), isColFlipped: coinFlip() });

function moveGrid(grid: Grid, move: GridMove): Grid {
  const moved = createEmptyGrid();
  grid.forEach((values, row) =>
    values.forEach((value, col) => {
      const [toRow, toCol] = move([row, col]);
      atIndex(moved, toRow)[toCol] = value;
    }),
  );
  return moved;
}

export const moveKillerPuzzle = ({ solution, puzzle, cages }: KillerPuzzle, move: GridMove): KillerPuzzle => ({
  solution: moveGrid(solution, move),
  puzzle: moveGrid(puzzle, move),
  cages: cages.map((cage) => ({ ...cage, cells: cage.cells.map(move) })),
});
