import { BookOpen, Brain, CheckCircle, Target, type LucideIcon } from 'lucide-react';

export const NOT_LOADED = '–';

export const EMPTY_CATEGORY_STATS = { mastered: 0, learning: 0, unseen: 0 } as const;

const STAT_TONE = { study: 'study', success: 'success', warning: 'warning', muted: 'muted' } as const;

type StatTone = keyof typeof STAT_TONE;

type StatKey = 'total' | 'mastered' | 'learning' | 'unseen';

export interface StatCardConfig {
  key: StatKey;
  label: string;
  Icon: LucideIcon;
  tone: StatTone;
}

export const STAT_CARDS: readonly StatCardConfig[] = [
  { key: 'total', label: '전체 문제', Icon: BookOpen, tone: STAT_TONE.study },
  { key: 'mastered', label: '마스터', Icon: CheckCircle, tone: STAT_TONE.success },
  { key: 'learning', label: '학습 중', Icon: Brain, tone: STAT_TONE.warning },
  { key: 'unseen', label: '미학습', Icon: Target, tone: STAT_TONE.muted },
];
