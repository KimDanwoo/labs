import type { TenGod } from '../model/types';

import type { TenGodAnalysis } from './tenGods';

type BodyStrength = 'strong' | 'weak' | 'balanced';

type BodyStrengthAnalysis = {
  strength: BodyStrength;
  supportScore: number;
  drainScore: number;
};

// 비겁·인성 = 일간 강화 / 식상·재성·관성 = 일간 소모
const SUPPORTING_GODS = new Set<TenGod>(['비견', '겁재', '편인', '정인']);
const DRAINING_GODS = new Set<TenGod>([
  '식신',
  '상관',
  '편재',
  '정재',
  '편관',
  '정관',
]);

// 월지는 사주의 핵심(월령), 일지도 중요도 높음
type Position = keyof TenGodAnalysis;
const POSITION_WEIGHTS: Record<Position, number> = {
  yearStem: 1.0,
  yearBranch: 1.0,
  monthStem: 1.2,
  monthBranch: 2.0,
  dayStem: 0, // 일간 자신 — 항상 비견이라 제외
  dayBranch: 1.5,
  hourStem: 1.0,
  hourBranch: 1.0,
};

function analyzeBodyStrength(tenGods: TenGodAnalysis): BodyStrengthAnalysis {
  let supportScore = 0;
  let drainScore = 0;

  for (const [pos, god] of Object.entries(tenGods) as [Position, TenGod][]) {
    const weight = POSITION_WEIGHTS[pos];
    if (weight === 0) continue;

    if (SUPPORTING_GODS.has(god)) {
      supportScore += weight;
    } else if (DRAINING_GODS.has(god)) {
      drainScore += weight;
    }
  }

  const net = supportScore - drainScore;
  const strength: BodyStrength =
    net >= 2 ? 'strong' : net <= -2 ? 'weak' : 'balanced';

  return { strength, supportScore, drainScore };
}

export { analyzeBodyStrength };
export type { BodyStrength, BodyStrengthAnalysis };
