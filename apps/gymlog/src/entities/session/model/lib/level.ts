import type { WorkoutSession } from '../types/session';
import { computeTotalVolume } from './stats';

export const MAX_LEVEL = 12;

// 레벨 도달에 필요한 누적 볼륨(kg = 무게×횟수).
// 세트만 채우는 게 아니라 점진적 과부하로 무게·양을 쌓아야 오른다. 뒤로 갈수록 급격히 가팔라진다.
export const LEVEL_THRESHOLDS = [
  0, 8_000, 25_000, 55_000, 100_000, 170_000, 270_000, 420_000, 650_000, 950_000, 1_400_000, 2_000_000,
] as const;

// 레벨별 이름(허약 → 머슬킹).
export const LEVEL_NAMES = [
  '헬린이',
  '운동 새싹',
  '초보 트레이니',
  '파워 입문',
  '단단해지는 중',
  '근성장 시작',
  '식스팩 등장',
  '머슬 비기너',
  '헬창',
  '머슬 몬스터',
  '짐브로',
  '머슬킹',
] as const;

export type Proficiency = {
  // 누적 볼륨(kg).
  totalVolume: number;
  level: number;
  name: string;
  // 다음 레벨까지 남은 볼륨(kg). 최고 레벨이면 null.
  toNext: number | null;
  // 현재 레벨 구간 진행도 0~1.
  progress: number;
  isMax: boolean;
};

export const computeProficiency = (sessions: WorkoutSession[]): Proficiency => {
  const totalVolume = computeTotalVolume(sessions);

  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (totalVolume >= (LEVEL_THRESHOLDS[i] ?? Infinity)) {
      level = i + 1;
    }
  }

  const isMax = level >= MAX_LEVEL;
  const floor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextAt = isMax ? null : (LEVEL_THRESHOLDS[level] ?? null);
  const toNext = nextAt === null ? null : Math.max(0, nextAt - totalVolume);
  const progress = nextAt === null ? 1 : Math.min(1, (totalVolume - floor) / (nextAt - floor));

  return {
    totalVolume,
    level,
    name: LEVEL_NAMES[level - 1] ?? '',
    toNext,
    progress,
    isMax,
  };
};
