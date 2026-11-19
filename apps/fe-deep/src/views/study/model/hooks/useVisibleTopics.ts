import { useEffect, useState, type RefObject } from 'react';

import type { StudyTopic } from '../../lib/studyDoc';
import { filterTopics, parseStudyTiers, type StudyFilter, type TopicMarks } from '../services/studyFilter';

interface VisibleTopicsInput {
  topics: StudyTopic[];
  tierKey: string;
  filter: StudyFilter;
  isLoaded: boolean;
  marksRef: RefObject<TopicMarks>;
}

export function useVisibleTopics({ topics, tierKey, filter, isLoaded, marksRef }: VisibleTopicsInput) {
  const [visibleTopics, setVisibleTopics] = useState(topics);

  useEffect(() => {
    setVisibleTopics(filterTopics(topics, parseStudyTiers(tierKey), filter, marksRef.current));
  }, [topics, tierKey, filter, isLoaded, marksRef]);

  return visibleTopics;
}
