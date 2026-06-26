import type { MuscleGroup, Split } from '@shared/training';

export const DAY_PLAN_TYPE = {
  focus: 'focus',
  routine: 'routine',
  free: 'free',
  rest: 'rest',
} as const;

export type DayPlanType = keyof typeof DAY_PLAN_TYPE;

export type DayPlan = {
  type: DayPlanType;
  // type === 'focus'일 때 그날 운동할 부위들. 그 외엔 빈 배열.
  muscles: MuscleGroup[];
  // type === 'routine'일 때 배정한 저장 루틴 id.
  routineId?: string;
};

// index = JS Date.getDay() (0=일 … 6=토). 길이 7.
export type WeekPlan = DayPlan[];

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
// 편집 화면 표시 순서(월요일 시작).
export const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const focus = (...muscles: MuscleGroup[]): DayPlan => ({ type: 'focus', muscles });
const rest = (): DayPlan => ({ type: 'rest', muscles: [] });
const free = (): DayPlan => ({ type: 'free', muscles: [] });

// 분할별 초심자 템플릿. 배열 index = getDay(0=일). 사용자는 이후 자유롭게 편집.
const TEMPLATES: Record<Split, () => WeekPlan> = {
  // 월·수·금 전신
  fullBody: () => [
    rest(),
    focus('chest', 'back', 'quads', 'shoulders', 'core'),
    rest(),
    focus('chest', 'back', 'quads', 'shoulders', 'core'),
    rest(),
    focus('chest', 'back', 'quads', 'shoulders', 'core'),
    rest(),
  ],
  // 월 가슴·삼두 / 화 하체·어깨 / 목 등·이두 / 금 하체 (주 4일)
  upperLower: () => [
    rest(),
    focus('chest', 'triceps'),
    focus('quads', 'hamstrings', 'glutes', 'shoulders'),
    rest(),
    focus('back', 'biceps'),
    focus('quads', 'hamstrings', 'calves'),
    rest(),
  ],
  // 월 밀기 / 화 당기기 / 수 하체 / 금 밀기
  ppl: () => [
    rest(),
    focus('chest', 'shoulders', 'triceps'),
    focus('back', 'biceps'),
    focus('quads', 'hamstrings', 'glutes', 'calves'),
    rest(),
    focus('chest', 'shoulders', 'triceps'),
    rest(),
  ],
  // 월 가슴 / 화 등 / 수 어깨 / 목 하체 / 금 팔
  broSplit: () => [
    rest(),
    focus('chest'),
    focus('back'),
    focus('shoulders'),
    focus('quads', 'hamstrings', 'glutes', 'calves'),
    focus('biceps', 'triceps'),
    rest(),
  ],
  // 커스텀은 전부 자율로 시작
  custom: () => [free(), free(), free(), free(), free(), free(), free()],
};

export const buildWeeklyPlanForSplit = (split: Split): WeekPlan => TEMPLATES[split]();

export const getDayPlan = (weekPlan: WeekPlan, weekday: number): DayPlan => weekPlan[weekday] ?? rest();
