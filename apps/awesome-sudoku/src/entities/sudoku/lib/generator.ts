import { SUDOKU_CELL_COUNT } from '@entities/sudoku/config/board';
import { CLASSIC_DIFFICULTY, KILLER_DIFFICULTY, TECHNIQUE } from '@entities/sudoku/config/game';
import { generateRandomSolution, staysUniqueWithout } from '@entities/sudoku/lib/backtrack';
import { deepCopyGrid } from '@entities/sudoku/lib/boardUtils';
import { generateKillerCages } from '@entities/sudoku/lib/cageLayout';
import { atIndex, cellAt } from '@entities/sudoku/lib/gridAccess';
import { shuffledPositions } from '@entities/sudoku/lib/random';
import { gradePuzzle } from '@entities/sudoku/lib/solver';
import type { Grid, SudokuBoard } from '@entities/sudoku/model/types/board';
import type { Difficulty, GradedDifficultySpec, KillerCage, Technique } from '@entities/sudoku/model/types/game';

const EMPTY = 0;
const KILLER_SEARCH_NODE_BUDGET = 2_000;

export const generateSolution = (): Grid => generateRandomSolution();

function digCells(solution: Grid, targetClues: number, cages?: KillerCage[], nodeBudget?: number): Grid {
  const puzzle = deepCopyGrid(solution);
  let clues = SUDOKU_CELL_COUNT;

  for (const [r, c] of shuffledPositions()) {
    if (clues <= targetClues) break;
    if (!staysUniqueWithout(puzzle, [r, c], cellAt(puzzle, r, c), cages, nodeBudget)) continue;
    atIndex(puzzle, r)[c] = EMPTY;
    clues--;
  }

  return puzzle;
}

export function toBoard(puzzle: Grid): SudokuBoard {
  return puzzle.map((row) =>
    row.map((value) => ({
      value: value === EMPTY ? null : value,
      isInitial: value !== EMPTY,
      isSelected: false,
      isConflict: false,
      isHint: false,
      notes: [],
    })),
  );
}

const CLASSIC_GRADE_ATTEMPTS = 60;
const KILLER_GRADE_ATTEMPTS = 10;

const GUESS_FREE_ATTEMPT_CAP_FACTOR = 4;

export function retryUntilGraded<T>(
  attempts: number,
  { minTechnique, maxTechnique }: GradedDifficultySpec,
  produce: () => T,
  gradeOf: (candidate: T) => Technique,
): T {
  const distanceToRange = (grade: number): number => {
    if (grade < minTechnique) return minTechnique - grade;
    if (grade > maxTechnique) return grade - maxTechnique + 0.5;
    return 0;
  };

  let best: T | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let lastGuess: T | null = null;
  const attemptCap = attempts * GUESS_FREE_ATTEMPT_CAP_FACTOR;

  for (let attempt = 0; attempt < attempts || (best === null && attempt < attemptCap); attempt++) {
    const candidate = produce();
    const grade = gradeOf(candidate);
    if (grade === TECHNIQUE.GUESS) {
      lastGuess = candidate;
      continue;
    }
    const distance = distanceToRange(grade);
    if (distance === 0) return candidate;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return (best ?? lastGuess)!;
}

export function generateBoard(solution: Grid, difficulty: Difficulty): SudokuBoard {
  const spec = CLASSIC_DIFFICULTY[difficulty];
  const puzzle = retryUntilGraded(CLASSIC_GRADE_ATTEMPTS, spec, () => digCells(solution, spec.clues), gradePuzzle);
  return toBoard(puzzle);
}

export function generateKillerBoard(
  solution: Grid,
  difficulty: Difficulty,
): { board: SudokuBoard; cages: KillerCage[] } {
  const spec = KILLER_DIFFICULTY[difficulty];
  const { puzzle, cages } = retryUntilGraded(
    KILLER_GRADE_ATTEMPTS,
    spec,
    () => {
      const cages = generateKillerCages(solution, spec.maxCageSize);
      return { cages, puzzle: digCells(solution, spec.clues, cages, KILLER_SEARCH_NODE_BUDGET) };
    },
    (candidate) => gradePuzzle(candidate.puzzle, candidate.cages),
  );

  return { board: toBoard(puzzle), cages };
}
