'use client';

import { toggleBookmark } from '../api';

/** Bookmark 도메인 뮤테이션 옵션 (useMutation에 스프레드하여 사용) */
export const bookmarkMutations = {
  toggle: {
    mutationFn: (questionId: string) => Promise.resolve(toggleBookmark(questionId)),
    invalidateKeys: [['bookmark']],
  },
};
