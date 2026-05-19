import type { FormState, ShichenOption, Step, StepConfig } from '../types';

export const INITIAL_STATE: FormState = {
  name: '',
  gender: 'male',
  birthDate: '',
  shichen: '',
  region: '',
  note: '',
};

export const SHICHEN_OPTIONS: ShichenOption[] = [
  {
    value: '자',
    label: '子 자시',
    timeRange: '23:30~01:29',
    hour: 0,
    minute: 0,
  },
  {
    value: '축',
    label: '丑 축시',
    timeRange: '01:30~03:29',
    hour: 2,
    minute: 30,
  },
  {
    value: '인',
    label: '寅 인시',
    timeRange: '03:30~05:29',
    hour: 4,
    minute: 30,
  },
  {
    value: '묘',
    label: '卯 묘시',
    timeRange: '05:30~07:29',
    hour: 6,
    minute: 30,
  },
  {
    value: '진',
    label: '辰 진시',
    timeRange: '07:30~09:29',
    hour: 8,
    minute: 30,
  },
  {
    value: '사',
    label: '巳 사시',
    timeRange: '09:30~11:29',
    hour: 10,
    minute: 30,
  },
  {
    value: '오',
    label: '午 오시',
    timeRange: '11:30~13:29',
    hour: 12,
    minute: 30,
  },
  {
    value: '미',
    label: '未 미시',
    timeRange: '13:30~15:29',
    hour: 14,
    minute: 30,
  },
  {
    value: '신',
    label: '申 신시',
    timeRange: '15:30~17:29',
    hour: 16,
    minute: 30,
  },
  {
    value: '유',
    label: '酉 유시',
    timeRange: '17:30~19:29',
    hour: 18,
    minute: 30,
  },
  {
    value: '술',
    label: '戌 술시',
    timeRange: '19:30~21:29',
    hour: 20,
    minute: 30,
  },
  {
    value: '해',
    label: '亥 해시',
    timeRange: '21:30~23:29',
    hour: 22,
    minute: 30,
  },
];

export const STEP_CONFIGS: Record<Step, StepConfig> = {
  0: {
    withBubble: '/form_step_1.png',
    withoutBubble: '/form_step_1_empty.jpeg',
  },
  1: {
    withBubble: '/form_step_2.jpeg',
    withoutBubble: '/form_step_2_empty.jpeg',
  },
};
