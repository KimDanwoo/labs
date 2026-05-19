import type { FiveElement, YinYang } from '@entities/destiny/data/elements';

type HeavenlyStem =
  | '甲'
  | '乙'
  | '丙'
  | '丁'
  | '戊'
  | '己'
  | '庚'
  | '辛'
  | '壬'
  | '癸';

type StemInfo = {
  element: FiveElement;
  yinYang: YinYang;
};

const STEM_DATA: Record<HeavenlyStem, StemInfo> = {
  甲: { element: '木', yinYang: '陽' },
  乙: { element: '木', yinYang: '陰' },
  丙: { element: '火', yinYang: '陽' },
  丁: { element: '火', yinYang: '陰' },
  戊: { element: '土', yinYang: '陽' },
  己: { element: '土', yinYang: '陰' },
  庚: { element: '金', yinYang: '陽' },
  辛: { element: '金', yinYang: '陰' },
  壬: { element: '水', yinYang: '陽' },
  癸: { element: '水', yinYang: '陰' },
} as const;

const HEAVENLY_STEMS: readonly HeavenlyStem[] = [
  '甲',
  '乙',
  '丙',
  '丁',
  '戊',
  '己',
  '庚',
  '辛',
  '壬',
  '癸',
] as const;

export { STEM_DATA, HEAVENLY_STEMS };
export type { HeavenlyStem, StemInfo };
