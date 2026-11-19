import type { BadgeVariant } from '@shared/ui/Badge';

import { STEP_KIND, type StudyStep } from '../lib/studyDoc';

export const ANSWER_FRAME: readonly string[] = ['왜?', '대안?', '왜 안 골랐나?', '단점?', '결과?', '다시 한다면?'];

export const ANSWER_FRAME_SEPARATOR = ' → ';

export const STEP_BADGE: Record<StudyStep['kind'], { label: string; variant: BadgeVariant }> = {
  [STEP_KIND.keywords]: { label: '키워드만 보고 말하기', variant: 'secondary' },
  [STEP_KIND.answer]: { label: '모범 답변', variant: 'secondary' },
  [STEP_KIND.mistake]: { label: '내 오답', variant: 'destructive' },
  [STEP_KIND.followUp]: { label: '꼬꼬무', variant: 'default' },
  [STEP_KIND.improve]: { label: '보완할 점', variant: 'warning' },
};

export const STUDY_RECALL_ID = 'study-recall';

export const STUDY_RECALL_ROWS = 3;
