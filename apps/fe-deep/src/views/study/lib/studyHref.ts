import type { StudySort } from '../model/services/studySort';

export const STUDY_LIST_HREF = '/study';

export function studySortHref(sort: StudySort) {
  return `${STUDY_LIST_HREF}?sort=${sort}`;
}

export function studyDocHref(slug: string) {
  return `${STUDY_LIST_HREF}/${slug}`;
}
