import { countTopicsByFilter } from '../../lib/countTopicsByFilter';
import type { StudyDoc } from '../../lib/studyDoc';
import { countByTier } from '../services/studyFilter';
import { useStudyFilterParams } from './useStudyFilterParams';
import { useTopicMarkSync } from './useTopicMarkSync';
import { useVisibleTopics } from './useVisibleTopics';

export function useStudyRunView(doc: StudyDoc) {
  const { filter, tiers, tierKey, handleToggleTier, handleChangeFilter } = useStudyFilterParams();
  const marks = useTopicMarkSync(doc.slug);
  const visibleTopics = useVisibleTopics({
    topics: doc.topics,
    tierKey,
    filter,
    isLoaded: marks.isLoaded,
    marksRef: marks.marksRef,
  });

  return {
    filter,
    tiers,
    tierCounts: countByTier(doc.topics),
    counts: countTopicsByFilter({ topics: doc.topics, tiers, understood: marks.understood, review: marks.review }),
    visibleTopics,
    runnerKey: `${tierKey}-${filter}-${String(marks.isLoaded)}`,
    understood: marks.understood,
    review: marks.review,
    handleToggleTier,
    handleChangeFilter,
    handleToggleUnderstood: marks.handleToggleUnderstood,
    handleToggleReview: marks.handleToggleReview,
  };
}
