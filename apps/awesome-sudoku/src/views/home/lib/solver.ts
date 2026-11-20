import { TECHNIQUE } from '@views/home/config/game';
import { createAdvancedTechniques } from '@views/home/lib/logic/advancedTechniques';
import { createBasicTechniques } from '@views/home/lib/logic/basicTechniques';
import { createCageTechniques } from '@views/home/lib/logic/cageTechniques';
import { createLogicBoard } from '@views/home/lib/logic/logicBoard';
import { unflatten } from '@views/home/lib/solverGrid';
import type { Grid } from '@views/home/model/types/board';
import type { KillerCage, Technique } from '@views/home/model/types/game';

export function solveLogically(grid: Grid, cages: KillerCage[] = []): { technique: Technique; grid: Grid } {
  const board = createLogicBoard(grid, cages);
  const { cells, cageInfos, isSolved } = board;
  const { nakedSingles, hiddenSingles, lockedCandidates, nakedSubsets, hiddenSubsets } = createBasicTechniques(board);
  const { fish, xyWing, xyzWing, simpleColoring } = createAdvancedTechniques(board);
  const { cageCombinations, cageLocked, innieOutie } = createCageTechniques(board);

  const hasCages = cageInfos.length > 0;
  const ladder: Array<[Technique, () => boolean]> = [
    [TECHNIQUE.SINGLE, () => nakedSingles() || hiddenSingles() || (hasCages && cageCombinations())],
    [TECHNIQUE.LOCKED, () => lockedCandidates() || (hasCages && (cageLocked() || innieOutie()))],
    [TECHNIQUE.SUBSET, () => nakedSubsets() || hiddenSubsets()],
    [TECHNIQUE.ADVANCED, () => fish() || xyWing() || xyzWing() || simpleColoring()],
  ];

  let hardest: Technique = TECHNIQUE.SINGLE;

  while (!isSolved()) {
    const rung = ladder.find(([, apply]) => apply());
    if (!rung) return { technique: TECHNIQUE.GUESS, grid: unflatten(cells) };
    hardest = Math.max(hardest, rung[0]) as Technique;
  }

  return { technique: hardest, grid: unflatten(cells) };
}

export const gradePuzzle = (grid: Grid, cages: KillerCage[] = []): Technique => solveLogically(grid, cages).technique;
