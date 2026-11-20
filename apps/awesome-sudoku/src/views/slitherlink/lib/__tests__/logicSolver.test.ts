import { TECHNIQUE } from '@views/slitherlink/config/difficulty';
import { SOLVE_STATUS } from '@views/slitherlink/config/solver';
import { bruteForceSolutions, toLines } from '@views/slitherlink/lib/__tests__/loopCheck';
import { seededRandom } from '@views/slitherlink/lib/__tests__/seededRandom';
import { solveLogically, type LogicResult } from '@views/slitherlink/lib/logic/logicSolver';
import { growLoopRegion, regionBoundary } from '@views/slitherlink/lib/loopRegion';
import { cluesFromSolution } from '@views/slitherlink/lib/puzzleGenerator';
import { randomInt } from '@views/slitherlink/lib/random';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { Clue, Random, Technique } from '@views/slitherlink/model/types/slitherlink';
import { describe, expect, it } from 'vitest';

const KEEP_CLUE_RATIO = 0.5;
const NOISE_CLUE_RATIO = 0.4;
const CLUE_VALUES = 4;
const SEEDS = Array.from({ length: 24 }, (_, index) => index + 1);
const TECHNIQUES: Technique[] = Object.values(TECHNIQUE);

const fullLoopClues = (size: number, random: Random): Clue[] => {
  const topology = getTopology(size);
  return cluesFromSolution(regionBoundary(growLoopRegion(size, random), topology), topology);
};

const loopClues = (size: number, random: Random): Clue[] =>
  fullLoopClues(size, random).map((clue) => (random() < KEEP_CLUE_RATIO ? clue : null));

const noiseClues = (size: number, random: Random): Clue[] =>
  Array.from({ length: size * size }, () => (random() < NOISE_CLUE_RATIO ? randomInt(random, CLUE_VALUES) : null));

const expectAgreesWithBruteForce = (result: LogicResult, solutions: boolean[][]): void => {
  if (result.status === SOLVE_STATUS.SOLVED) expect([toLines(result.edges)]).toEqual(solutions);
  if (result.status === SOLVE_STATUS.CONTRADICTION) expect(solutions).toEqual([]);
  if (solutions.length > 1) expect(result.status).toBe(SOLVE_STATUS.STUCK);
};

describe('solveLogically', () => {
  it.each([3, 4])('%i칸 판: 고리에서 뽑은 단서로 푼 결과가 전수 탐색과 어긋나지 않는다', (size) => {
    for (const seed of SEEDS) {
      const clues = loopClues(size, seededRandom(seed));
      const solutions = bruteForceSolutions(clues, getTopology(size));
      for (const technique of TECHNIQUES) {
        expectAgreesWithBruteForce(solveLogically(size, clues, technique), solutions);
      }
    }
  });

  it.each([3, 4])('%i칸 판: 아무렇게나 놓은 단서로 푼 결과도 전수 탐색과 어긋나지 않는다', (size) => {
    for (const seed of SEEDS) {
      const clues = noiseClues(size, seededRandom(seed));
      const solutions = bruteForceSolutions(clues, getTopology(size));
      expectAgreesWithBruteForce(solveLogically(size, clues, TECHNIQUE.TRIAL), solutions);
    }
  });

  it('쉬운 기법으로 풀리는 판은 더 어려운 기법을 허용해도 같은 기법으로 풀린다', () => {
    const solvedByBasic = SEEDS.map((seed) => fullLoopClues(5, seededRandom(seed))).filter(
      (clues) => solveLogically(5, clues, TECHNIQUE.BASIC).status === SOLVE_STATUS.SOLVED,
    );

    expect(solvedByBasic.length).toBeGreaterThan(0);
    for (const clues of solvedByBasic) {
      const trial = solveLogically(5, clues, TECHNIQUE.TRIAL);
      expect(trial.status).toBe(SOLVE_STATUS.SOLVED);
      expect(trial.hardest).toBe(TECHNIQUE.BASIC);
      expect(trial.edges).toEqual(solveLogically(5, clues, TECHNIQUE.BASIC).edges);
    }
  });

  it('단서가 하나도 없으면 풀리지 않고 멈춘다', () => {
    expect(
      solveLogically(
        3,
        Array.from({ length: 9 }, () => null),
        TECHNIQUE.TRIAL,
      ).status,
    ).toBe(SOLVE_STATUS.STUCK);
  });

  it('칸 하나를 두르는 고리만 가능한 단서는 기본 규칙만으로 풀린다', () => {
    const clues: Clue[] = [4, null, null, null];
    const result = solveLogically(2, clues, TECHNIQUE.BASIC);

    expect(result.status).toBe(SOLVE_STATUS.SOLVED);
    expect(toLines(result.edges)).toEqual(bruteForceSolutions(clues, getTopology(2))[0]);
  });
});
