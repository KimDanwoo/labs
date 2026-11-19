import { useSearchParams } from 'next/navigation';

import { parseStudySort, STUDY_SORT_PARAM, type StudySort } from '../services/studySort';

export function useStudySort(): StudySort {
  return parseStudySort(useSearchParams().get(STUDY_SORT_PARAM));
}
