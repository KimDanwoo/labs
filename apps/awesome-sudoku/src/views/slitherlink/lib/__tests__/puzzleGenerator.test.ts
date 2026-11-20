import { SLITHERLINK_DIFFICULTY, SLITHERLINK_LEVEL, TECHNIQUE } from '@views/slitherlink/config/difficulty';
import { SOLVE_STATUS } from '@views/slitherlink/config/solver';
import { bruteForceSolutions, cluesMatch, isSingleLoop, toLines } from '@views/slitherlink/lib/__tests__/loopCheck';
import { seededRandom } from '@views/slitherlink/lib/__tests__/seededRandom';
import { solveLogically } from '@views/slitherlink/lib/logic/logicSolver';
import { generateFromSpec, generateSlitherlink } from '@views/slitherlink/lib/puzzleGenerator';
import { getTopology } from '@views/slitherlink/lib/topology';
import type { SlitherlinkLevel, Technique } from '@views/slitherlink/model/types/slitherlink';
import { describe, expect, it } from 'vitest';

const LEVELS: SlitherlinkLevel[] = Object.values(SLITHERLINK_LEVEL);
const SEEDS = [1, 2, 3];
const SMALL_SEEDS = Array.from({ length: 12 }, (_, index) => index + 1);
const GENERATION_TIMEOUT_MS = 30_000;

const EASIER_TECHNIQUE: Record<SlitherlinkLevel, Technique | null> = {
  [SLITHERLINK_LEVEL.EASY]: null,
  [SLITHERLINK_LEVEL.MEDIUM]: TECHNIQUE.BASIC,
  [SLITHERLINK_LEVEL.HARD]: TECHNIQUE.LOOP,
};

describe.each(LEVELS)('generateSlitherlink(%s)', (level) => {
  const spec = SLITHERLINK_DIFFICULTY[level];
  const easier = EASIER_TECHNIQUE[level];

  it.each(SEEDS)(
    '시드 %i: 정답은 단서와 맞는 닫힌 고리 하나이고, 허용한 기법으로만 그 정답에 닿는다',
    (seed) => {
      const puzzle = generateSlitherlink(level, seededRandom(seed));
      const topology = getTopology(spec.size);
      const lines = toLines(puzzle.solution);

      expect(puzzle.size).toBe(spec.size);
      expect(isSingleLoop(lines, topology)).toBe(true);
      expect(cluesMatch(lines, puzzle.clues, topology)).toBe(true);
      const solved = solveLogically(spec.size, puzzle.clues, spec.maxTechnique);
      expect(solved.status).toBe(SOLVE_STATUS.SOLVED);
      expect(solved.edges).toEqual(puzzle.solution);
      if (easier !== null) expect(solveLogically(spec.size, puzzle.clues, easier).status).toBe(SOLVE_STATUS.STUCK);
    },
    GENERATION_TIMEOUT_MS,
  );
});

describe('generateFromSpec', () => {
  it('4칸 판으로 만든 퍼즐은 전수 탐색으로도 해가 정답 하나뿐이다', () => {
    const spec = { size: 4, minTechnique: TECHNIQUE.BASIC, maxTechnique: TECHNIQUE.TRIAL };
    const topology = getTopology(spec.size);
    const puzzles = SMALL_SEEDS.flatMap((seed) => generateFromSpec(spec, seededRandom(seed))?.puzzle ?? []);

    expect(puzzles.length).toBeGreaterThan(0);
    for (const puzzle of puzzles) {
      expect(bruteForceSolutions(puzzle.clues, topology)).toEqual([toLines(puzzle.solution)]);
    }
  });

  it('같은 시드는 같은 퍼즐을 만든다', () => {
    const spec = SLITHERLINK_DIFFICULTY[SLITHERLINK_LEVEL.MEDIUM];
    expect(generateFromSpec(spec, seededRandom(7))).toEqual(generateFromSpec(spec, seededRandom(7)));
  });
});
