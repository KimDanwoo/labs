import { GENERATION_ATTEMPTS, SLITHERLINK_DIFFICULTY, TECHNIQUE } from '@views/slitherlink/config/difficulty';
import { SOLVE_STATUS } from '@views/slitherlink/config/solver';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import { tallyEdges } from '@views/slitherlink/lib/logic/edgeTally';
import { solveLogically } from '@views/slitherlink/lib/logic/logicSolver';
import { growLoopRegion, regionBoundary } from '@views/slitherlink/lib/loopRegion';
import { shuffled } from '@views/slitherlink/lib/random';
import { getTopology } from '@views/slitherlink/lib/topology';
import type {
  Clue,
  DifficultySpec,
  EdgeState,
  GridTopology,
  Random,
  SlitherlinkLevel,
  SlitherlinkPuzzle,
  Technique,
} from '@views/slitherlink/model/types/slitherlink';

export interface GradedPuzzle {
  puzzle: SlitherlinkPuzzle;
  hardest: Technique;
}

interface ReducedClues {
  clues: Clue[];
  hardest: Technique;
}

export const cluesFromSolution = (solution: readonly EdgeState[], topology: GridTopology): Clue[] =>
  topology.cellEdges.map((cellEdges) => tallyEdges(solution, cellEdges).lines);

const techniquesUpTo = (maxTechnique: Technique): Technique[] =>
  Object.values(TECHNIQUE).filter((technique) => technique <= maxTechnique);

const removalPass = (
  start: ReducedClues,
  size: number,
  technique: Technique,
  order: readonly number[],
): ReducedClues => {
  let reduced = start;
  for (const cell of order) {
    if (itemAt(reduced.clues, cell) === null) continue;
    const clues = [...reduced.clues];
    clues[cell] = null;
    const result = solveLogically(size, clues, technique);
    if (result.status === SOLVE_STATUS.SOLVED) reduced = { clues, hardest: result.hardest };
  }
  return reduced;
};

const removeClues = (fullClues: readonly Clue[], spec: DifficultySpec, random: Random): ReducedClues | null => {
  const initial = solveLogically(spec.size, fullClues, spec.maxTechnique);
  if (initial.status !== SOLVE_STATUS.SOLVED) return null;

  const order = shuffled(random, [...fullClues.keys()]);
  return techniquesUpTo(spec.maxTechnique).reduce<ReducedClues>(
    (reduced, technique) => removalPass(reduced, spec.size, technique, order),
    { clues: [...fullClues], hardest: initial.hardest },
  );
};

export const generateFromSpec = (spec: DifficultySpec, random: Random): GradedPuzzle | null => {
  const topology = getTopology(spec.size);
  const solution = regionBoundary(growLoopRegion(spec.size, random), topology);
  const reduced = removeClues(cluesFromSolution(solution, topology), spec, random);
  if (!reduced) return null;
  return { puzzle: { size: spec.size, clues: reduced.clues, solution }, hardest: reduced.hardest };
};

export const generateSlitherlink = (level: SlitherlinkLevel, random: Random = Math.random): SlitherlinkPuzzle => {
  const spec = SLITHERLINK_DIFFICULTY[level];
  let fallback: SlitherlinkPuzzle | null = null;
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const graded = generateFromSpec(spec, random);
    if (graded && graded.hardest >= spec.minTechnique) return graded.puzzle;
    fallback = graded?.puzzle ?? fallback;
  }
  if (fallback) return fallback;
  throw new Error(`슬리더링크 ${level} 퍼즐을 ${GENERATION_ATTEMPTS}번 시도했지만 만들지 못했다`);
};
