import { BOARD_SIZE, SUDOKU_CELL_COUNT } from '@entities/board/model/constants';
import type { Grid, GridPosition, SudokuBoard } from '@entities/board/model/types';
import { deepCopyGrid } from '@entities/board/model/utils';
import { CLASSIC_DIFFICULTY, KILLER_DIFFICULTY } from '@entities/game/model/constants';
import type { Difficulty, GradedDifficultySpec, KillerCage, Technique } from '@entities/game/model/types';
import { shuffleArray } from './common';
import { generateRandomSolution, gradePuzzle, staysUniqueWithout } from './solver';

const EMPTY = 0;
const MIN_CAGE_SIZE = 2;
/** 1칸 케이지(값이 그대로 드러남)가 없는 레이아웃을 찾기 위한 시도 수 */
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

/**
 * @description 완성된 솔루션 그리드 생성
 */
export const generateSolution = (): Grid => generateRandomSolution();

/**
 * @description 솔루션에서 칸을 하나씩 파내되 유일해가 깨지면 되돌린다. targetClues에 닿으면 멈추고,
 * 그 전에 더 파낼 칸이 없으면(최소 퍼즐) 그대로 반환한다.
 */
function digCells(solution: Grid, targetClues: number, cages?: KillerCage[], nodeBudget?: number): Grid {
  const puzzle = deepCopyGrid(solution);
  let clues = SUDOKU_CELL_COUNT;

  for (const [r, c] of shuffledPositions()) {
    if (clues <= targetClues) break;
    if (!staysUniqueWithout(puzzle, [r, c], puzzle[r][c], cages, nodeBudget)) continue;
    puzzle[r][c] = EMPTY;
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
/** 킬러는 케이지 조합·45규칙으로 대부분 범위에 들어 적게 시도해도 된다 */
const KILLER_GRADE_ATTEMPTS = 10;

/**
 * @description 후보를 만들어 채점하고, 기법 범위에 들면 바로 반환한다. 끝까지 못 들면 가장 가까운 후보를 쓴다.
 * 같은 거리면 추측이 필요한(범위 위) 쪽보다 풀 수 있는(범위 아래) 쪽을 택한다.
 */
function retryUntilGraded<T>(
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

  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = produce();
    const distance = distanceToRange(gradeOf(candidate));
    if (distance === 0) return candidate;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best!;
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

// ── 킬러 케이지 ────────────────────────────────────────────────

const key = (r: number, c: number): number => r * BOARD_SIZE + c;

const neighborsOf = ([r, c]: GridPosition): GridPosition[] =>
  ORTHOGONAL.map(([dr, dc]): GridPosition => [r + dr, c + dc]).filter(
    ([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE,
  );

/**
 * @description 무작위 시작점에서 인접 칸으로 케이지를 키운다. 같은 값은 한 케이지에 넣지 않는다(킬러 규칙).
 * 키우다 막혀 1칸으로 남은 케이지는 값이 겹치지 않는 인접 케이지에 붙여 본다.
 */
function layoutCages(solution: Grid, maxCageSize: number): GridPosition[][] {
  const cageOf = new Array<number>(SUDOKU_CELL_COUNT).fill(-1);
  const cages: GridPosition[][] = [];
  const valueAt = ([r, c]: GridPosition): number => solution[r][c];
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
      const next = frontier[randomInt(frontier.length)];
      cage.push(next);
      cageOf[key(...next)] = cageIndex;
    }

    cages.push(cage);
  }

  for (const cage of cages) {
    if (cage.length !== 1) continue;
    const cell = cage[0];
    const host = neighborsOf(cell)
      .map((p) => cages[cageOf[key(...p)]])
      .find((other) => other !== cage && other.length < maxCageSize && !hasValue(other, valueAt(cell)));
    if (!host) continue;
    host.push(cell);
    cageOf[key(...cell)] = cages.indexOf(host);
    cage.length = 0;
  }

  return cages.filter((cage) => cage.length > 0);
}

/**
 * @description 케이지 레이아웃 생성 — 몇 번 뽑아 1칸 케이지(값이 그대로 드러나는 케이지)가 가장 적은 것을 고른다.
 */
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
    sum: cells.reduce((total, [r, c]) => total + solution[r][c], 0),
  }));
}

/**
 * @description 킬러 보드 생성 — 케이지를 깔고 케이지 제약 포함 유일해를 유지하며 힌트를 목표 수까지 파낸 뒤,
 * 킬러 기법(케이지 조합·45규칙)까지 포함한 채점이 범위에 들 때까지 케이지부터 다시 뽑는다.
 */
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
