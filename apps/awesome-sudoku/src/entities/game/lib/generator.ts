import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '../model/constants/board';
import { CLASSIC_DIFFICULTY, KILLER_DIFFICULTY, TECHNIQUE } from '../model/constants/game';
import { shuffleArray } from '../model/services/common';
import type { Grid, GridPosition, SudokuBoard } from '../model/types/board';
import type { Difficulty, GradedDifficultySpec, KillerCage, Technique } from '../model/types/game';
import { deepCopyGrid } from './boardUtils';
import { atIndex, cellAt } from './gridAccess';
import { generateRandomSolution, gradePuzzle, staysUniqueWithout } from './solver';

const EMPTY = 0;
const MIN_CAGE_SIZE = 2;
const CAGE_LAYOUT_ATTEMPTS = 20;
/**
 * 킬러 유일해 검사 1회당 탐색 노드 상한. 예산 안에 유일함을 증명 못 한 칸은 힌트로 남긴다(안전한 쪽).
 * ponytail: 생성은 워커에서 돌지만 첫 판은 기다려야 한다. 예산 5천은 힌트 0.5칸 감소에 시간 2배, 5만은 expert p95 1초.
 */
const KILLER_SEARCH_NODE_BUDGET = 2_000;

const ORTHOGONAL: GridPosition[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const shuffledPositions = (): GridPosition[] => {
  const positions: GridPosition[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) positions.push([r, c]);
  shuffleArray(positions);
  return positions;
};

const randomInt = (maxExclusive: number): number => Math.floor(Math.random() * maxExclusive);

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

function toBoard(puzzle: Grid): SudokuBoard {
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

/** expert(ADVANCED 전용)는 무작위 최소 퍼즐의 ~10%만 해당해 60회면 99.8% 적중한다 */
const CLASSIC_GRADE_ATTEMPTS = 60;
const KILLER_GRADE_ATTEMPTS = 10;

/**
 * 추측이 필요한 판만 계속 나올 때의 상한. 실측(시도 300회)에서 GUESS는 시도당 최대 ~25%라 사실상 닿지 않는다.
 * ponytail: 상한에 닿으면 GUESS 판이라도 반환한다 — 판을 못 주는 것보다 낫다.
 */
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

/**
 * @description 클래식 보드 생성 — 힌트 수를 맞춘 뒤 사람 기법으로 채점해 난이도 범위에 들 때까지 다시 판다.
 * (한 칸씩 파고 되돌리는 "걷기"도 시험했으나 등급은 칸 수가 아니라 어느 칸이 비었는지에 좌우되어
 * SINGLE↔GUESS로 진동했고, 최소 퍼즐에서는 더 팔 수 없어 폴백이 크게 늘었다. 새로 파는 쪽이 낫다.)
 */
export function generateBoard(solution: Grid, difficulty: Difficulty): SudokuBoard {
  const spec = CLASSIC_DIFFICULTY[difficulty];
  const puzzle = retryUntilGraded(CLASSIC_GRADE_ATTEMPTS, spec, () => digCells(solution, spec.clues), gradePuzzle);
  return toBoard(puzzle);
}

const key = (r: number, c: number): number => r * BOARD_SIZE + c;

const neighborsOf = ([r, c]: GridPosition): GridPosition[] =>
  ORTHOGONAL.map(([dr, dc]): GridPosition => [r + dr, c + dc]).filter(
    ([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE,
  );

function layoutCages(solution: Grid, maxCageSize: number): GridPosition[][] {
  const cageOf = new Array<number>(SUDOKU_CELL_COUNT).fill(-1);
  const cages: GridPosition[][] = [];
  const valueAt = ([r, c]: GridPosition): number => cellAt(solution, r, c);
  const hasValue = (cage: GridPosition[], value: number): boolean => cage.some((p) => valueAt(p) === value);

  for (const start of shuffledPositions()) {
    if (cageOf[key(...start)] !== -1) continue;

    const cage: GridPosition[] = [start];
    const cageIndex = cages.length;
    cageOf[key(...start)] = cageIndex;
    const targetSize = MIN_CAGE_SIZE + randomInt(maxCageSize - MIN_CAGE_SIZE + 1);

    while (cage.length < targetSize) {
      const frontier = cage.flatMap(neighborsOf).filter((p) => cageOf[key(...p)] === -1 && !hasValue(cage, valueAt(p)));
      if (frontier.length === 0) break;
      const next = atIndex(frontier, randomInt(frontier.length));
      cage.push(next);
      cageOf[key(...next)] = cageIndex;
    }

    cages.push(cage);
  }

  for (const cage of cages) {
    if (cage.length !== 1) continue;
    const cell = atIndex(cage, 0);
    const host = neighborsOf(cell)
      .map((p) => cages[atIndex(cageOf, key(...p))])
      .find(
        (other) =>
          other !== undefined && other !== cage && other.length < maxCageSize && !hasValue(other, valueAt(cell)),
      );
    if (!host) continue;
    host.push(cell);
    cageOf[key(...cell)] = cages.indexOf(host);
    cage.length = 0;
  }

  return cages.filter((cage) => cage.length > 0);
}

export function generateKillerCages(solution: Grid, maxCageSize: number): KillerCage[] {
  let best: GridPosition[][] | null = null;
  let bestSingles = Number.POSITIVE_INFINITY;

  for (let attempt = 0; attempt < CAGE_LAYOUT_ATTEMPTS; attempt++) {
    const layout = layoutCages(solution, maxCageSize);
    const singles = layout.filter((cage) => cage.length === 1).length;
    if (singles < bestSingles) {
      bestSingles = singles;
      best = layout;
    }
  }

  return best!.map((cells, index) => ({
    id: index + 1,
    cells,
    sum: cells.reduce((total, [r, c]) => total + cellAt(solution, r, c), 0),
  }));
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
