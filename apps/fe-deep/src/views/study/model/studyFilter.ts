import type { StudyTopic } from './parseHandbook';

export const STUDY_FILTER = {
  all: 'all',
  todo: 'todo',
  done: 'done',
} as const;

export type StudyFilter = (typeof STUDY_FILTER)[keyof typeof STUDY_FILTER];

export function parseStudyFilter(raw: string | null): StudyFilter {
  if (raw === STUDY_FILTER.todo || raw === STUDY_FILTER.done) return raw;
  return STUDY_FILTER.all;
}

export function filterTopics(topics: StudyTopic[], filter: StudyFilter, understood: Set<string>): StudyTopic[] {
  if (filter === STUDY_FILTER.all) return topics;
  if (filter === STUDY_FILTER.done) return topics.filter((topic) => understood.has(topic.title));
  return topics.filter((topic) => !understood.has(topic.title));
}
