'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { ADMIN_ROUTE } from '@features/admin/model/services';
import { useQuizQuestions } from '@features/admin/model/hooks';
import type { QuizRow } from '@features/admin/model/types';
import { QuizEditor } from '@features/admin/ui';

function emptyQuiz(): QuizRow {
  return {
    id: '',
    character_id: ALL_CHARACTER_IDS[0],
    question: '',
    options: ['', '', '', ''],
    correct_index: 0,
    fact: '',
    is_active: true,
    sort_order: 0,
  };
}

export default function QuizDetailPage() {
  const id = useParams().id as string;
  const router = useRouter();
  const isNew = id === 'new';
  const { data, isLoading } = useQuizQuestions();

  const back = () => router.push(ADMIN_ROUTE.quiz);
  const row = isNew ? emptyQuiz() : data?.find((r) => r.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href={ADMIN_ROUTE.quiz} className="text-xs text-muted btn-press">
          ←
        </Link>
        <h1 className="text-sm font-bold text-foreground">
          {isNew ? '새 문제' : '문제 편집'}
        </h1>
      </div>

      {!isNew && isLoading && (
        <p className="text-xs text-muted text-center py-8">불러오는 중...</p>
      )}
      {!isNew && !isLoading && !row && (
        <p className="text-xs text-red text-center py-8">찾을 수 없어요</p>
      )}
      {row && <QuizEditor row={row} onDone={back} />}
    </div>
  );
}
