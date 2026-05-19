import { HIDDEN_STEMS_TABLE } from '../data/hiddenStems';
import { STEM_DATA } from '../data/stems';
import type {
  HeavenlyStem,
  EarthlyBranch,
  FourPillars,
  TenGod,
} from '../model/types';

type TenGodMapping = {
  position: string;
  tenGod: TenGod;
  stem: HeavenlyStem;
};

type TenGodAnalysis = {
  yearStem: TenGod;
  yearBranch: TenGod;
  monthStem: TenGod;
  monthBranch: TenGod;
  dayStem: TenGod;
  dayBranch: TenGod;
  hourStem: TenGod;
  hourBranch: TenGod;
};

// 오행 상생: 木→火→土→金→水→木
const GENERATES: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

// 오행 상극: 木→土→水→火→金→木
const CONTROLS: Record<string, string> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

function getTenGod(dayStem: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  const dayInfo = STEM_DATA[dayStem];
  const targetInfo = STEM_DATA[targetStem];

  const sameYinYang = dayInfo.yinYang === targetInfo.yinYang;

  if (dayInfo.element === targetInfo.element) {
    return sameYinYang ? '비견' : '겁재';
  }

  if (GENERATES[dayInfo.element] === targetInfo.element) {
    return sameYinYang ? '식신' : '상관';
  }

  if (CONTROLS[dayInfo.element] === targetInfo.element) {
    return sameYinYang ? '편재' : '정재';
  }

  if (CONTROLS[targetInfo.element] === dayInfo.element) {
    return sameYinYang ? '편관' : '정관';
  }

  // 나를 생하는 오행: GENERATES[target] === day
  if (GENERATES[targetInfo.element] === dayInfo.element) {
    return sameYinYang ? '편인' : '정인';
  }

  // 이 경우는 발생하지 않지만 타입 안전성을 위해
  return '비견';
}

function getBranchMainStem(branch: EarthlyBranch): HeavenlyStem {
  return HIDDEN_STEMS_TABLE[branch].main.stem;
}

function analyzeTenGods(fourPillars: FourPillars): TenGodAnalysis {
  const dayStem = fourPillars.day.stem;

  return {
    yearStem: getTenGod(dayStem, fourPillars.year.stem),
    yearBranch: getTenGod(dayStem, getBranchMainStem(fourPillars.year.branch)),
    monthStem: getTenGod(dayStem, fourPillars.month.stem),
    monthBranch: getTenGod(
      dayStem,
      getBranchMainStem(fourPillars.month.branch),
    ),
    dayStem: getTenGod(dayStem, dayStem),
    dayBranch: getTenGod(dayStem, getBranchMainStem(fourPillars.day.branch)),
    hourStem: getTenGod(dayStem, fourPillars.hour.stem),
    hourBranch: getTenGod(dayStem, getBranchMainStem(fourPillars.hour.branch)),
  };
}

export { getTenGod, analyzeTenGods };
export type { TenGodMapping, TenGodAnalysis };
