'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  STUDY_FILTER,
  countByTier,
  filterTopics,
  getTopicTier,
  parseStudyFilter,
  parseStudyTiers,
  serializeStudyTiers,
  useReviewTopics,
  useUnderstoodTopics,
  type StudyDoc,
  type StudyFilter,
  type StudyTier,
  type TopicMarks,
} from '../model';
import { StudyFilterBar } from './StudyFilterBar';
import { StudyRunner } from './StudyRunner';

interface StudyRunViewProps {
  doc: StudyDoc;
}

const EMPTY_MESSAGES: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '해당하는 주제가 없습니다.',
  [STUDY_FILTER.todo]: '남은 주제가 없습니다. 전부 이해했습니다 🎉',
  [STUDY_FILTER.done]: '아직 이해됨으로 표시한 주제가 없습니다.',
  [STUDY_FILTER.review]: '오답노트가 비어 있습니다. 기억이 흐릿한 주제를 담아두세요.',
};

const TIER_PARAM = 'tier';
const FILTER_PARAM = 'filter';

export function StudyRunView({ doc }: StudyRunViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseStudyFilter(searchParams.get(FILTER_PARAM));
  const tiers = parseStudyTiers(searchParams.get(TIER_PARAM));

  const { understood, isLoaded: isUnderstoodLoaded, toggle: toggleUnderstood } = useUnderstoodTopics(doc.slug);
  const { review, isLoaded: isReviewLoaded, toggle: toggleReview } = useReviewTopics(doc.slug);
  const isLoaded = isUnderstoodLoaded && isReviewLoaded;

  // 체크 즉시 목록이 훅 바뀌지 않도록, 필터 변경·최초 로드 시점의 스냅샷으로만 목록을 다시 계산한다.
  const marksRef = useRef<TopicMarks>({ understood, review });
  useEffect(() => {
    marksRef.current = { understood, review };
  }, [understood, review]);

  // 이해됨과 오답노트는 동시에 켜지지 않는다 — 한쪽을 켜면 반대쪽을 끈다.
  const handleToggleUnderstood = (topicTitle: string) => {
    if (!understood.has(topicTitle) && review.has(topicTitle)) toggleReview(topicTitle);
    toggleUnderstood(topicTitle);
  };

  const handleToggleReview = (topicTitle: string) => {
    if (!review.has(topicTitle) && understood.has(topicTitle)) toggleUnderstood(topicTitle);
    toggleReview(topicTitle);
  };

  const tierKey = serializeStudyTiers(tiers);
  const [visibleTopics, setVisibleTopics] = useState(doc.topics);
  useEffect(() => {
    setVisibleTopics(filterTopics(doc.topics, parseStudyTiers(tierKey), filter, marksRef.current));
  }, [doc.topics, tierKey, filter, isLoaded]);

  const replaceParams = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleToggleTier = (tier: StudyTier) => {
    const next = new Set(tiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);

    const params = new URLSearchParams(searchParams);
    const serialized = serializeStudyTiers(next);
    if (serialized) params.set(TIER_PARAM, serialized);
    else params.delete(TIER_PARAM);
    replaceParams(params);
  };

  const handleChangeFilter = (next: StudyFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === STUDY_FILTER.all) params.delete(FILTER_PARAM);
    else params.set(FILTER_PARAM, next);
    replaceParams(params);
  };

  const tierScoped = tiers.size === 0 ? doc.topics : doc.topics.filter((topic) => tiers.has(getTopicTier(topic)));
  const doneCount = tierScoped.filter((topic) => understood.has(topic.title)).length;
  const counts: Record<StudyFilter, number> = {
    [STUDY_FILTER.all]: tierScoped.length,
    [STUDY_FILTER.todo]: tierScoped.length - doneCount,
    [STUDY_FILTER.done]: doneCount,
    [STUDY_FILTER.review]: tierScoped.filter((topic) => review.has(topic.title)).length,
  };

  const runnerKey = `${tierKey}-${filter}-${String(isLoaded)}`;

  return (
    <div>
      <StudyFilterBar
        tiers={tiers}
        tierCounts={countByTier(doc.topics)}
        filter={filter}
        counts={counts}
        onToggleTier={handleToggleTier}
        onChangeFilter={handleChangeFilter}
      />
      {visibleTopics.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[filter]}</div>
      ) : (
        <StudyRunner
          key={runnerKey}
          docTitle={doc.title}
          topics={visibleTopics}
          understood={understood}
          review={review}
          onToggleUnderstood={handleToggleUnderstood}
          onToggleReview={handleToggleReview}
        />
      )}
    </div>
  );
}
