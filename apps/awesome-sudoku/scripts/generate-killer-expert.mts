import { writeFile } from 'node:fs/promises';

import { GAME_LEVEL, TECHNIQUE } from '../src/entities/sudoku/config/game';
import { generateKillerBoard, generateSolution } from '../src/entities/sudoku/lib/generator';
import { encodeKillerPuzzle } from '../src/entities/sudoku/lib/killerPuzzleCodec';
import { gradePuzzle } from '../src/entities/sudoku/lib/solver';
import type { Grid } from '../src/entities/sudoku/model/types/board';
import type { EncodedKillerPuzzle, KillerPuzzle } from '../src/entities/sudoku/model/types/game';

const PUZZLE_COUNT = 200;
const OUT = new URL('../src/entities/sudoku/lib/killerExpertPuzzles.ts', import.meta.url);
const EMPTY = 0;

const isExpert = ({ puzzle, cages }: KillerPuzzle): boolean => {
  const grade = gradePuzzle(puzzle, cages);
  return grade >= TECHNIQUE.SUBSET && grade <= TECHNIQUE.ADVANCED;
};

function nextCandidate(): KillerPuzzle {
  const solution = generateSolution();
  const { board, cages } = generateKillerBoard(solution, GAME_LEVEL.EXPERT);
  const puzzle: Grid = board.map((row) => row.map((cell) => cell.value ?? EMPTY));
  return { solution, puzzle, cages };
}

function collect(): EncodedKillerPuzzle[] {
  const found: EncodedKillerPuzzle[] = [];
  let tried = 0;
  while (found.length < PUZZLE_COUNT) {
    tried += 1;
    const candidate = nextCandidate();
    if (!isExpert(candidate)) continue;
    found.push(encodeKillerPuzzle(candidate));
    process.stdout.write(`\r${found.length}/${PUZZLE_COUNT} (시도 ${tried})`);
  }
  process.stdout.write('\n');
  return found;
}

const source = (puzzles: readonly EncodedKillerPuzzle[]): string =>
  [
    "import type { EncodedKillerPuzzle } from '@entities/sudoku/model/types/game';",
    '',
    `export const KILLER_EXPERT_PUZZLES: readonly EncodedKillerPuzzle[] = ${JSON.stringify(puzzles)};`,
    '',
  ].join('\n');

await writeFile(OUT, source(collect()));
