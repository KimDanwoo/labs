'use client';

import { saveLocalProgress, updateQuestionProgress } from '@entities/progress/api';
import type { UserProgress } from '@entities/progress/model';

/** Progress 도메인 뮤테이션 옵션 (useMutation에 스프레드하여 사용) */
export const progressMutations = {
  updateQuestion: {
    mutationFn: ({ questionId, knew }: { questionId: string; knew: boolean }) =>
      Promise.resolve(updateQuestionProgress(questionId, knew)),
    invalidateKeys: [['progress']],
  },

  saveLocal: {
    mutationFn: (progress: Record<string, UserProgress>) => Promise.resolve(saveLocalProgress(progress)),
    invalidateKeys: [['progress']],
  },
};
