import type { StudyDocSummary } from '../../lib/studyDocSummary';

export const STUDY_SORT = { latest: 'latest', oldest: 'oldest' } as const;

export type StudySort = (typeof STUDY_SORT)[keyof typeof STUDY_SORT];

export const DEFAULT_STUDY_SORT: StudySort = STUDY_SORT.latest;

export const STUDY_SORT_PARAM = 'sort';

export const STUDY_SORT_LABELS: Record<StudySort, string> = { latest: '최신순', oldest: '오래된순' };

export function parseStudySort(value: string | null): StudySort {
  return value === STUDY_SORT.oldest ? STUDY_SORT.oldest : DEFAULT_STUDY_SORT;
}

export function sortStudyDocs(docs: StudyDocSummary[], sort: StudySort): StudyDocSummary[] {
  const direction = sort === STUDY_SORT.latest ? -1 : 1;
  return [...docs].sort((a, b) => {
    if (!a.date || !b.date) return Number(!a.date) - Number(!b.date);
    return a.date.localeCompare(b.date) * direction;
  });
}
