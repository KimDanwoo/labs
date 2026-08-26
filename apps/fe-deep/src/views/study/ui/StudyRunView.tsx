'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  STUDY_FILTER,
  filterTopics,
  parseStudyFilter,
  useUnderstoodTopics,
  type StudyDoc,
  type StudyFilter,
} from '../model';
import { StudyFilterBar } from './StudyFilterBar';
import { StudyRunner } from './StudyRunner';

interface StudyRunViewProps {
  doc: StudyDoc;
}

const EMPTY_MESSAGES: Record<StudyFilter, string> = {
  [STUDY_FILTER.all]: '학습할 내용이 없습니다.',
  [STUDY_FILTER.todo]: '남은 주제가 없습니다. 전부 이해했습니다 🎉',
  [STUDY_FILTER.done]: '아직 이해됨으로 표시한 주제가 없습니다.',
};

export function StudyRunView({ doc }: StudyRunViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseStudyFilter(searchParams.get('filter'));

  const { understood, isLoaded, toggle } = useUnderstoodTopics(doc.slug);

  // 체크 즉시 목록이 훅 바뀌지 않도록, 필터 변경·최초 로드 시점의 스냅샷으로만 목록을 다시 계산한다.
  const understoodRef = useRef(understood);
  useEffect(() => {
    understoodRef.current = understood;
  }, [understood]);

  const [visibleTopics, setVisibleTopics] = useState(doc.topics);
  useEffect(() => {
    setVisibleTopics(filterTopics(doc.topics, filter, understoodRef.current));
  }, [doc.topics, filter, isLoaded]);

  const handleFilterChange = (next: StudyFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === STUDY_FILTER.all) params.delete('filter');
    else params.set('filter', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const doneCount = doc.topics.filter((topic) => understood.has(topic.title)).length;
  const counts: Record<StudyFilter, number> = {
    [STUDY_FILTER.all]: doc.topics.length,
    [STUDY_FILTER.todo]: doc.topics.length - doneCount,
    [STUDY_FILTER.done]: doneCount,
  };

  const runnerKey = filter === STUDY_FILTER.all ? filter : `${filter}-${String(isLoaded)}`;

  return (
    <div>
      <StudyFilterBar filter={filter} counts={counts} onChange={handleFilterChange} />
      {visibleTopics.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{EMPTY_MESSAGES[filter]}</div>
      ) : (
        <StudyRunner
          key={runnerKey}
          docTitle={doc.title}
          topics={visibleTopics}
          understood={understood}
          onToggleUnderstood={toggle}
        />
      )}
    </div>
  );
}
