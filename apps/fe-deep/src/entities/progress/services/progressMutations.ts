'use client';

import { reviewCard, updateQuestionProgress, saveLocalProgress } from '../api';
import type { ReviewRating, UserProgress } from '../model';

/** Progress 도메인 뮤테이션 옵션 (useMutation에 스프레드하여 사용) */
export const progressMutations = {
  reviewCard: {
    mutationFn: ({ questionId, rating }: { questionId: string; rating: ReviewRating }) =>
      Promise.resolve(reviewCard(questionId, rating)),
    invalidateKeys: [['progress']],
  },

  updateQuestion: {
    mutationFn: ({ questionId, knew }: { questionId: string; knew: boolean }) =>
      Promise.resolve(updateQuestionProgress(questionId, knew)),
    invalidateKeys: [['progress']],
  },

  saveLocal: {
    mutationFn: (progress: Record<string, UserProgress>) =>
      Promise.resolve(saveLocalProgress(progress)),
    invalidateKeys: [['progress']],
  },
};
