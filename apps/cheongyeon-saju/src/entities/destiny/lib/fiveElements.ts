import { BRANCH_DATA } from '../data/branches';
import { STEM_DATA } from '../data/stems';
import type { FiveElement, FourPillars, YinYang } from '../model/types';

type FiveElementCount = Record<FiveElement, number>;

type FiveElementAnalysis = {
  counts: FiveElementCount;
  dominant: FiveElement[];
  weak: FiveElement[];
  missing: FiveElement[];
  dayMasterElement: FiveElement;
  dayMasterYinYang: YinYang;
};

const FIVE_ELEMENTS: readonly FiveElement[] = ['木', '火', '土', '金', '水'];

function analyzeFiveElements(fourPillars: FourPillars): FiveElementAnalysis {
  const counts: FiveElementCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  const pillars = [
    fourPillars.year,
    fourPillars.month,
    fourPillars.day,
    fourPillars.hour,
  ];

  for (const pillar of pillars) {
    counts[STEM_DATA[pillar.stem].element]++;
    counts[BRANCH_DATA[pillar.branch].element]++;
  }

  const maxCount = Math.max(...(Object.values(counts) as number[]));
  const minCount = Math.min(...(Object.values(counts) as number[]));

  const dominant = FIVE_ELEMENTS.filter((el) => counts[el] === maxCount);
  const weak = FIVE_ELEMENTS.filter((el) => counts[el] === minCount);
  const missing = FIVE_ELEMENTS.filter((el) => counts[el] === 0);

  const dayMasterElement = STEM_DATA[fourPillars.day.stem].element;
  const dayMasterYinYang = STEM_DATA[fourPillars.day.stem].yinYang;

  return {
    counts,
    dominant,
    weak,
    missing,
    dayMasterElement,
    dayMasterYinYang,
  };
}

export { analyzeFiveElements };
export type { FiveElementCount, FiveElementAnalysis };
