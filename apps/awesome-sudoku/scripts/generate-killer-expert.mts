/**
 * 킬러 전문가 묶음을 만든다. 전문가 판(SUBSET 이상)은 무작위 생성의 몇 %만 해당해 실시간으로 만들 수 없다.
 *
 *   pnpm --filter awesome-sudoku puzzles:killer-expert
 */

import { writeFile } from 'node:fs/promises';

import { GAME_LEVEL, TECHNIQUE } from '../src/views/home/config/game';
import { generateKillerBoard, generateSolution } from '../src/views/home/lib/generator';
import { encodeKillerPuzzle } from '../src/views/home/lib/killerPuzzleCodec';
import { gradePuzzle } from '../src/views/home/lib/solver';
import type { Grid } from '../src/views/home/model/types/board';
import type { EncodedKillerPuzzle, KillerPuzzle } from '../src/views/home/model/types/game';

const PUZZLE_COUNT = 200;
const OUT = new URL('../src/views/home/lib/killerExpertPuzzles.ts', import.meta.url);
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
    '// 생성물 — 직접 고치지 않는다. `pnpm --filter awesome-sudoku puzzles:killer-expert`로 다시 만든다.',
    "import type { EncodedKillerPuzzle } from '../model/types/game';",
    '',
    `export const KILLER_EXPERT_PUZZLES: readonly EncodedKillerPuzzle[] = ${JSON.stringify(puzzles)};`,
    '',
  ].join('\n');

await writeFile(OUT, source(collect()));
