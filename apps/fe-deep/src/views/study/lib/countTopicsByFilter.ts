import { STUDY_FILTER, getTopicTier, type StudyFilter, type StudyTier } from '../model/services/studyFilter';
import type { StudyTopic } from './studyDoc';

interface TopicCountInput {
  topics: StudyTopic[];
  tiers: Set<StudyTier>;
  understood: Set<string>;
  review: Set<string>;
}

export function countTopicsByFilter({
  topics,
  tiers,
  understood,
  review,
}: TopicCountInput): Record<StudyFilter, number> {
  const tierScoped = tiers.size === 0 ? topics : topics.filter((topic) => tiers.has(getTopicTier(topic)));
  const doneCount = tierScoped.filter((topic) => understood.has(topic.title)).length;
  return {
    [STUDY_FILTER.all]: tierScoped.length,
    [STUDY_FILTER.todo]: tierScoped.length - doneCount,
    [STUDY_FILTER.done]: doneCount,
    [STUDY_FILTER.review]: tierScoped.filter((topic) => review.has(topic.title)).length,
  };
}
