import { countSteps } from './parseHandbook';
import type { StudyDoc } from './studyDoc';

export interface StudyDocSummary {
  slug: string;
  title: string;
  date: string | null;
  topicCount: number;
  stepCount: number;
}

export function toStudyDocSummary(doc: StudyDoc): StudyDocSummary {
  return {
    slug: doc.slug,
    title: doc.title,
    date: doc.date,
    topicCount: doc.topics.length,
    stepCount: countSteps(doc),
  };
}
