import type { EarthlyBranch } from '@entities/destiny/data/branches';
import type { HeavenlyStem } from '@entities/destiny/data/stems';

type VoidEntry = {
  cycleStart: HeavenlyStem;
  voidBranches: readonly [EarthlyBranch, EarthlyBranch];
};

// 공망 테이블: 6순(六旬)별 공망 지지
const VOID_TABLE: readonly VoidEntry[] = [
  { cycleStart: '甲', voidBranches: ['戌', '亥'] }, // 甲子순
  { cycleStart: '甲', voidBranches: ['申', '酉'] }, // 甲戌순 (index 10부터)
  { cycleStart: '甲', voidBranches: ['午', '未'] }, // 甲申순 (index 20부터)
  { cycleStart: '甲', voidBranches: ['辰', '巳'] }, // 甲午순 (index 30부터)
  { cycleStart: '甲', voidBranches: ['寅', '卯'] }, // 甲辰순 (index 40부터)
  { cycleStart: '甲', voidBranches: ['子', '丑'] }, // 甲寅순 (index 50부터)
] as const;

// 60갑자 인덱스로 공망 지지를 바로 조회하는 맵 (index 0~59)
// 각 순(旬)은 10개 갑자를 포함하므로 Math.floor(index / 10)으로 순 결정
const VOID_BY_CYCLE_INDEX: readonly (readonly [
  EarthlyBranch,
  EarthlyBranch,
])[] = [
  ['戌', '亥'], // 甲子순 (0~9)
  ['申', '酉'], // 甲戌순 (10~19)
  ['午', '未'], // 甲申순 (20~29)
  ['辰', '巳'], // 甲午순 (30~39)
  ['寅', '卯'], // 甲辰순 (40~49)
  ['子', '丑'], // 甲寅순 (50~59)
] as const;

export { VOID_TABLE, VOID_BY_CYCLE_INDEX };
export type { VoidEntry };
