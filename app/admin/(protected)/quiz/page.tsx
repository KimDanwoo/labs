'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { ADMIN_ROUTE } from '@app/admin/_lib/api';
import { useQuizQuestions } from '@app/admin/_lib/hooks';
import CharacterTabs from '@app/admin/_components/CharacterTabs';

export default function QuizAdminPage() {
  const { data, isLoading, isError } = useQuizQuestions();
  const [tab, setTab] = useState<string>(ALL_CHARACTER_IDS[0]);

  const visible = (data ?? []).filter((r) => r.character_id === tab);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href={ADMIN_ROUTE.dashboard} className="text-xs text-muted btn-press">
          ←
        </Link>
        <h1 className="text-sm font-bold text-foreground">취향 퀴즈</h1>
      </div>

      <CharacterTabs value={tab} onChange={setTab} />

      <Link
        href={`${ADMIN_ROUTE.quiz}/new`}
        className="block w-full py-2.5 rounded-xl border border-dashed border-card-border text-xs font-bold text-muted text-center btn-press"
      >
        + 새 문제
      </Link>

      {isLoading && (
        <p className="text-xs text-muted text-center py-8">불러오는 중...</p>
      )}
      {isError && (
        <p className="text-xs text-red text-center py-8">불러오기 실패</p>
      )}

      {visible.map((r) => (
        <Link
          key={r.id}
          href={`${ADMIN_ROUTE.quiz}/${r.id}`}
          className="card p-3 block btn-press"
        >
          <div className="flex items-center gap-2">
            {!r.is_active && <span className="text-[10px] text-red">비활성</span>}
            <span className="ml-auto text-muted text-xs">→</span>
          </div>
          <p className="text-xs text-foreground mt-1 line-clamp-2">
            {r.question}
          </p>
        </Link>
      ))}

      {!isLoading && visible.length === 0 && (
        <p className="text-xs text-muted text-center py-6">아직 문제가 없어요</p>
      )}
    </div>
  );
}
