'use client';

import type { StudyDocSummary } from '../lib/studyDocSummary';
import { useStudySort } from '../model/hooks/useStudySort';
import { StudyDocBoardView } from './StudyDocBoardView';

interface StudyDocBoardProps {
  docs: StudyDocSummary[];
}

export function StudyDocBoard({ docs }: StudyDocBoardProps) {
  const sort = useStudySort();
  return <StudyDocBoardView docs={docs} sort={sort} />;
}
