import {
  BRANCH_BREAKS,
  BRANCH_DIRECTION_COMBINATIONS,
  BRANCH_HARMS,
  BRANCH_PUNISHMENTS,
  BRANCH_SIX_COMBINATIONS,
  BRANCH_SIX_CONFLICTS,
  BRANCH_TRIPLE_COMBINATIONS,
  STEM_COMBINATIONS,
} from '../data/combinations';
import type {
  EarthlyBranch,
  FiveElement,
  FourPillars,
  HeavenlyStem,
} from '../model/types';

type StemCombinationResult = {
  stems: [HeavenlyStem, HeavenlyStem];
  element: FiveElement;
  positions: [string, string];
};

type BranchCombinationResult = {
  branches: EarthlyBranch[];
  element?: FiveElement;
  type: string;
  positions: string[];
};

type BranchConflictResult = {
  branches: [EarthlyBranch, EarthlyBranch];
  positions: [string, string];
};

type BranchPunishmentResult = {
  branches: EarthlyBranch[];
  type: string;
  positions: string[];
};

type CombinationAnalysis = {
  stemCombinations: StemCombinationResult[];
  branchSixCombinations: BranchCombinationResult[];
  branchTripleCombinations: BranchCombinationResult[];
  branchDirectionCombinations: BranchCombinationResult[];
  branchConflicts: BranchConflictResult[];
  branchPunishments: BranchPunishmentResult[];
  branchBreaks: BranchConflictResult[];
  branchHarms: BranchConflictResult[];
};

const PILLAR_POSITIONS = ['year', 'month', 'day', 'hour'] as const;
type PillarPosition = (typeof PILLAR_POSITIONS)[number];

function getStemsWithPositions(
  fourPillars: FourPillars,
): Array<{ stem: HeavenlyStem; position: PillarPosition }> {
  return PILLAR_POSITIONS.map((pos) => ({
    stem: fourPillars[pos].stem,
    position: pos,
  }));
}

function getBranchesWithPositions(
  fourPillars: FourPillars,
): Array<{ branch: EarthlyBranch; position: PillarPosition }> {
  return PILLAR_POSITIONS.map((pos) => ({
    branch: fourPillars[pos].branch,
    position: pos,
  }));
}

function findStemCombinations(
  fourPillars: FourPillars,
): StemCombinationResult[] {
  const stems = getStemsWithPositions(fourPillars);
  const results: StemCombinationResult[] = [];

  for (const combo of STEM_COMBINATIONS) {
    const [a, b] = combo.stems;
    const matchA = stems.find((s) => s.stem === a);
    const matchB = stems.find((s) => s.stem === b);

    if (matchA !== undefined && matchB !== undefined) {
      results.push({
        stems: [a, b],
        element: combo.resultElement,
        positions: [matchA.position, matchB.position],
      });
    }
  }

  return results;
}

function findBranchSixCombinations(
  fourPillars: FourPillars,
): BranchCombinationResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchCombinationResult[] = [];

  for (const combo of BRANCH_SIX_COMBINATIONS) {
    const [a, b] = combo.branches;
    const matchA = branches.find((br) => br.branch === a);
    const matchB = branches.find((br) => br.branch === b);

    if (matchA !== undefined && matchB !== undefined) {
      results.push({
        branches: [a, b],
        element: combo.resultElement,
        type: '육합',
        positions: [matchA.position, matchB.position],
      });
    }
  }

  return results;
}

function findBranchTripleCombinations(
  fourPillars: FourPillars,
): BranchCombinationResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchCombinationResult[] = [];

  for (const combo of BRANCH_TRIPLE_COMBINATIONS) {
    const matched = combo.branches
      .map((b) => branches.find((br) => br.branch === b))
      .filter(
        (m): m is { branch: EarthlyBranch; position: PillarPosition } =>
          m !== undefined,
      );

    if (matched.length >= 2) {
      results.push({
        branches: matched.map((m) => m.branch),
        element: combo.resultElement,
        type: '삼합',
        positions: matched.map((m) => m.position),
      });
    }
  }

  return results;
}

function findBranchDirectionCombinations(
  fourPillars: FourPillars,
): BranchCombinationResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchCombinationResult[] = [];

  for (const combo of BRANCH_DIRECTION_COMBINATIONS) {
    const matched = combo.branches
      .map((b) => branches.find((br) => br.branch === b))
      .filter(
        (m): m is { branch: EarthlyBranch; position: PillarPosition } =>
          m !== undefined,
      );

    if (matched.length >= 2) {
      results.push({
        branches: matched.map((m) => m.branch),
        element: combo.resultElement,
        type: '방합',
        positions: matched.map((m) => m.position),
      });
    }
  }

  return results;
}

function findBranchConflicts(fourPillars: FourPillars): BranchConflictResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchConflictResult[] = [];

  for (const [a, b] of BRANCH_SIX_CONFLICTS) {
    const matchA = branches.find((br) => br.branch === a);
    const matchB = branches.find((br) => br.branch === b);

    if (matchA !== undefined && matchB !== undefined) {
      results.push({
        branches: [a, b],
        positions: [matchA.position, matchB.position],
      });
    }
  }

  return results;
}

function findBranchPunishments(
  fourPillars: FourPillars,
): BranchPunishmentResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchPunishmentResult[] = [];

  for (const punishment of BRANCH_PUNISHMENTS) {
    if (punishment.type === '자형') {
      const [single] = punishment.branches;
      const matches = branches.filter((br) => br.branch === single);

      if (matches.length >= 2) {
        results.push({
          branches: [single],
          type: '자형',
          positions: matches.map((m) => m.position),
        });
      }
    } else {
      const matched = punishment.branches
        .map((b) => branches.find((br) => br.branch === b))
        .filter(
          (m): m is { branch: EarthlyBranch; position: PillarPosition } =>
            m !== undefined,
        );

      if (matched.length >= 2) {
        results.push({
          branches: matched.map((m) => m.branch),
          type: punishment.type,
          positions: matched.map((m) => m.position),
        });
      }
    }
  }

  return results;
}

function findBranchBreaks(fourPillars: FourPillars): BranchConflictResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchConflictResult[] = [];

  for (const [a, b] of BRANCH_BREAKS) {
    const matchA = branches.find((br) => br.branch === a);
    const matchB = branches.find((br) => br.branch === b);

    if (matchA !== undefined && matchB !== undefined) {
      results.push({
        branches: [a, b],
        positions: [matchA.position, matchB.position],
      });
    }
  }

  return results;
}

function findBranchHarms(fourPillars: FourPillars): BranchConflictResult[] {
  const branches = getBranchesWithPositions(fourPillars);
  const results: BranchConflictResult[] = [];

  for (const [a, b] of BRANCH_HARMS) {
    const matchA = branches.find((br) => br.branch === a);
    const matchB = branches.find((br) => br.branch === b);

    if (matchA !== undefined && matchB !== undefined) {
      results.push({
        branches: [a, b],
        positions: [matchA.position, matchB.position],
      });
    }
  }

  return results;
}

function analyzeCombinations(fourPillars: FourPillars): CombinationAnalysis {
  return {
    stemCombinations: findStemCombinations(fourPillars),
    branchSixCombinations: findBranchSixCombinations(fourPillars),
    branchTripleCombinations: findBranchTripleCombinations(fourPillars),
    branchDirectionCombinations: findBranchDirectionCombinations(fourPillars),
    branchConflicts: findBranchConflicts(fourPillars),
    branchPunishments: findBranchPunishments(fourPillars),
    branchBreaks: findBranchBreaks(fourPillars),
    branchHarms: findBranchHarms(fourPillars),
  };
}

export type {
  BranchCombinationResult,
  BranchConflictResult,
  BranchPunishmentResult,
  CombinationAnalysis,
  StemCombinationResult,
};
export { analyzeCombinations };
