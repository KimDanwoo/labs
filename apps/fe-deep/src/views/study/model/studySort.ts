import type { StudyDoc } from './parseHandbook';

export const STUDY_SORT = { latest: 'latest', oldest: 'oldest' } as const;

export type StudySort = (typeof STUDY_SORT)[keyof typeof STUDY_SORT];

export const STUDY_SORT_LABELS: Record<StudySort, string> = { latest: '최신순', oldest: '오래된순' };

export function parseStudySort(value: string | undefined): StudySort {
  return value === STUDY_SORT.oldest ? STUDY_SORT.oldest : STUDY_SORT.latest;
}

/** 날짜 없는 문서는 정렬 방향과 무관하게 맨 뒤에 둔다. */
export function sortStudyDocs(docs: StudyDoc[], sort: StudySort): StudyDoc[] {
  const direction = sort === STUDY_SORT.latest ? -1 : 1;
  return [...docs].sort((a, b) => {
    if (!a.date || !b.date) return Number(!a.date) - Number(!b.date);
    return a.date.localeCompare(b.date) * direction;
  });
}
