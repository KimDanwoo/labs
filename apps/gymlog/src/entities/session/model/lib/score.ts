import type { WorkoutSession } from '../types/session';
import { computeProficiency } from './level';
import { computeTotalVolume } from './stats';

const WEEK_DAYS = 7;

// 정규화 기준(만점에 해당하는 값). 세 지표를 0~100으로 환산할 때 분모.
const FULL = {
  volume: 2_000_000, // 누적 볼륨(kg) — 최고 레벨(머슬킹) 기준
  level: 12,
  weekly: 100_000, // 주간 볼륨(kg) — 고강도 한 주 기준
} as const;

export type RankingScore = {
  score: number; // 세 지표 정규화 후 평균(0~100)
  totalVolume: number;
  level: number;
  weeklyVolume: number;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

// 누적 볼륨 / 레벨 / 주간 볼륨을 각각 0~100으로 정규화해 평균한 종합 점수.
export const computeRankingScore = (sessions: WorkoutSession[], reference: Date): RankingScore => {
  const totalVolume = computeTotalVolume(sessions);
  const { level } = computeProficiency(sessions);

  const cutoff = new Date(reference);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (WEEK_DAYS - 1));
  const weeklySessions = sessions.filter((session) => new Date(session.startedAt) >= cutoff);
  const weeklyVolume = computeTotalVolume(weeklySessions);

  const volumeNorm = clampPercent((totalVolume / FULL.volume) * 100);
  const levelNorm = clampPercent((level / FULL.level) * 100);
  const weeklyNorm = clampPercent((weeklyVolume / FULL.weekly) * 100);

  return {
    score: Math.round((volumeNorm + levelNorm + weeklyNorm) / 3),
    totalVolume,
    level,
    weeklyVolume,
  };
};
