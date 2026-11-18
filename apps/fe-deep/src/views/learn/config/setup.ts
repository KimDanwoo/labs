import { ArrowDownAZ, Shuffle, type LucideIcon } from 'lucide-react';

import { STUDY_ORDER, type StudyOrder } from '../model/constants/study';

export interface StudyOrderOption {
  value: StudyOrder;
  label: string;
  Icon: LucideIcon;
}

export const STUDY_ORDER_OPTIONS: readonly StudyOrderOption[] = [
  { value: STUDY_ORDER.sequential, label: '순서대로', Icon: ArrowDownAZ },
  { value: STUDY_ORDER.random, label: '무작위', Icon: Shuffle },
];
