import { SIXTY_JIAZI } from '../data/sixtyJiazi';
import { VOID_BY_CYCLE_INDEX } from '../data/void';
import type { EarthlyBranch, FourPillars } from '../model/types';

type VoidAnalysis = {
  voidBranches: [EarthlyBranch, EarthlyBranch];
  affectedPillars: string[];
};

const PILLAR_POSITIONS = ['year', 'month', 'day', 'hour'] as const;

function analyzeVoid(fourPillars: FourPillars): VoidAnalysis {
  const dayPillar = fourPillars.day;
  const dayIndex = SIXTY_JIAZI.findIndex(
    (p) => p.stem === dayPillar.stem && p.branch === dayPillar.branch,
  );

  const cycleIndex = Math.floor(dayIndex / 10);
  const voidBranches = VOID_BY_CYCLE_INDEX[cycleIndex];

  const affectedPillars = PILLAR_POSITIONS.filter((pos) =>
    (voidBranches as readonly EarthlyBranch[]).includes(
      fourPillars[pos].branch,
    ),
  );

  return {
    voidBranches: [voidBranches[0], voidBranches[1]],
    affectedPillars,
  };
}

export type { VoidAnalysis };
export { analyzeVoid };
