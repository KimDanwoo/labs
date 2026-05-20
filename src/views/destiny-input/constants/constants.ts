import type {
  FormState,
  RegionOption,
  ShichenOption,
  Step,
  StepConfig,
} from '../types';

export const INITIAL_STATE: FormState = {
  name: '',
  gender: 'male',
  birthDate: '',
  shichen: '',
  unknownTime: false,
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

export const REGION_OPTIONS: RegionOption[] = [
  { value: 'seoul', label: '서울', longitude: 127.0 },
  { value: 'busan', label: '부산', longitude: 129.0 },
  { value: 'daegu', label: '대구', longitude: 128.6 },
  { value: 'incheon', label: '인천', longitude: 126.7 },
  { value: 'gwangju', label: '광주', longitude: 126.9 },
  { value: 'daejeon', label: '대전', longitude: 127.4 },
  { value: 'ulsan', label: '울산', longitude: 129.3 },
  { value: 'sejong', label: '세종', longitude: 127.0 },
  { value: 'suwon', label: '수원', longitude: 127.0 },
  { value: 'cheongju', label: '청주', longitude: 127.5 },
  { value: 'jeonju', label: '전주', longitude: 127.1 },
  { value: 'chuncheon', label: '춘천', longitude: 127.7 },
  { value: 'gangneung', label: '강릉', longitude: 128.9 },
  { value: 'jeju', label: '제주', longitude: 126.5 },
  { value: 'mokpo', label: '목포', longitude: 126.4 },
  { value: 'andong', label: '안동', longitude: 128.7 },
  { value: 'wonju', label: '원주', longitude: 127.9 },
  { value: 'yeosu', label: '여수', longitude: 127.7 },
  { value: 'pohang', label: '포항', longitude: 129.4 },
  { value: 'gimhae', label: '김해', longitude: 128.9 },
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
