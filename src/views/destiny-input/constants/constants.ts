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
    timeRange: '23:00~01:00',
    hour: 0,
    minute: 0,
  },
  {
    value: '축',
    label: '丑 축시',
    timeRange: '01:00~03:00',
    hour: 2,
    minute: 0,
  },
  {
    value: '인',
    label: '寅 인시',
    timeRange: '03:00~05:00',
    hour: 4,
    minute: 0,
  },
  {
    value: '묘',
    label: '卯 묘시',
    timeRange: '05:00~07:00',
    hour: 6,
    minute: 0,
  },
  {
    value: '진',
    label: '辰 진시',
    timeRange: '07:00~09:00',
    hour: 8,
    minute: 0,
  },
  {
    value: '사',
    label: '巳 사시',
    timeRange: '09:00~11:00',
    hour: 10,
    minute: 0,
  },
  {
    value: '오',
    label: '午 오시',
    timeRange: '11:00~13:00',
    hour: 12,
    minute: 0,
  },
  {
    value: '미',
    label: '未 미시',
    timeRange: '13:00~15:00',
    hour: 14,
    minute: 0,
  },
  {
    value: '신',
    label: '申 신시',
    timeRange: '15:00~17:00',
    hour: 16,
    minute: 0,
  },
  {
    value: '유',
    label: '酉 유시',
    timeRange: '17:00~19:00',
    hour: 18,
    minute: 0,
  },
  {
    value: '술',
    label: '戌 술시',
    timeRange: '19:00~21:00',
    hour: 20,
    minute: 0,
  },
  {
    value: '해',
    label: '亥 해시',
    timeRange: '21:00~23:00',
    hour: 22,
    minute: 0,
  },
];

export const REGION_OPTIONS: RegionOption[] = [
  { value: 'seoul', label: '서울', longitude: 127.0 },
  { value: 'gyeonggi', label: '경기', longitude: 127.0 },
  { value: 'busan', label: '부산', longitude: 129.0 },
  { value: 'daegu', label: '대구', longitude: 128.6 },
  { value: 'incheon', label: '인천', longitude: 126.7 },
  { value: 'gwangju', label: '광주', longitude: 126.9 },
  { value: 'daejeon', label: '대전', longitude: 127.4 },
  { value: 'ulsan', label: '울산', longitude: 129.3 },
  { value: 'sejong', label: '세종', longitude: 127.0 },
  { value: 'suwon', label: '수원', longitude: 127.0 },
  { value: 'yongin', label: '용인', longitude: 127.2 },
  { value: 'goyang', label: '고양', longitude: 126.8 },
  { value: 'seongnam', label: '성남', longitude: 127.1 },
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
    withoutBubble: '/form_step_1_empty.png',
  },
  1: {
    withBubble: '/form_step_2.png',
    withoutBubble: '/form_step_2_empty.png',
  },
};
