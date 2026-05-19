import type { HeavenlyStem } from '@entities/destiny/data/stems';

// 년간 그룹 (5가지 패턴)
type StemGroup = 0 | 1 | 2 | 3 | 4;

function getStemGroup(stem: HeavenlyStem): StemGroup {
  const groups: Record<HeavenlyStem, StemGroup> = {
    甲: 0,
    己: 0,
    乙: 1,
    庚: 1,
    丙: 2,
    辛: 2,
    丁: 3,
    壬: 3,
    戊: 4,
    癸: 4,
  };
  return groups[stem];
}

// 년간 → 인월(寅月, 1월) 천간 기준표
// 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲
const YEAR_STEM_TO_MONTH_BASE: Record<StemGroup, HeavenlyStem> = {
  0: '丙', // 甲己년
  1: '戊', // 乙庚년
  2: '庚', // 丙辛년
  3: '壬', // 丁壬년
  4: '甲', // 戊癸년
} as const;

// 일간 → 자시(子時, 0시) 천간 기준표
// 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬
const DAY_STEM_TO_HOUR_BASE: Record<StemGroup, HeavenlyStem> = {
  0: '甲', // 甲己일
  1: '丙', // 乙庚일
  2: '戊', // 丙辛일
  3: '庚', // 丁壬일
  4: '壬', // 戊癸일
} as const;

export { YEAR_STEM_TO_MONTH_BASE, DAY_STEM_TO_HOUR_BASE, getStemGroup };
export type { StemGroup };
