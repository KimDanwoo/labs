import type { Goal, Split } from '@shared/training';
import { buildWeeklyPlanForSplit, type WeekPlan } from './weekPlan';

export const DEFAULT_REST_SEC = 60;
export const DEFAULT_SETS = 3;

export type UserProfile = {
  goal: Goal;
  // 선호 분할. 주간 플랜 템플릿 생성·홈 둘러보기 기준.
  split: Split;
  // 요일별 운동 계획(부위/자율/휴식). 분할 기준 템플릿으로 시작, 자유 편집.
  weekPlan: WeekPlan;
  // 모든 종목에 적용할 기본 세트 수(루틴 항목이 지정하면 그쪽 우선).
  defaultSets: number;
  // 세트 사이 기본 휴식(초). 기본 1분.
  restSec: number;
  // 온보딩(첫 설정) 완료 여부.
  onboarded: boolean;
};

export const DEFAULT_PROFILE: UserProfile = {
  goal: 'hypertrophy',
  split: 'fullBody',
  weekPlan: buildWeeklyPlanForSplit('fullBody'),
  defaultSets: DEFAULT_SETS,
  restSec: DEFAULT_REST_SEC,
  onboarded: false,
};

// 세트 수는 스텝퍼로 폭넓게 선택(1~12).
export const SET_COUNT_MIN = 1;
export const SET_COUNT_MAX = 12;

export const REST_SEC_OPTIONS = [30, 45, 60, 90, 120, 180] as const;
