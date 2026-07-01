'use client';

import Link from 'next/link';
import { ADMIN_ROUTE } from '@app/admin/_lib/api';
import { useCharacters } from '@app/admin/_lib/hooks';

export default function CharactersAdminPage() {
  const { data, isLoading, isError } = useCharacters();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href={ADMIN_ROUTE.dashboard} className="text-xs text-muted btn-press">
          ←
        </Link>
        <h1 className="text-sm font-bold text-foreground">캐릭터</h1>
      </div>

      {isLoading && (
        <p className="text-xs text-muted text-center py-8">불러오는 중...</p>
      )}
      {isError && (
        <p className="text-xs text-red text-center py-8">불러오기 실패</p>
      )}

      {data?.map((c) => (
        <Link
          key={c.id}
          href={`${ADMIN_ROUTE.characters}/${c.id}`}
          className="card p-3 flex items-center gap-3 btn-press"
        >
          <span className="text-2xl">{c.emoji}</span>
          <div>
            <div className="text-sm font-bold text-foreground">{c.name}</div>
            <div className="text-[11px] text-muted">{c.id}</div>
          </div>
          <span className="ml-auto text-muted">→</span>
        </Link>
      ))}
    </div>
  );
}
