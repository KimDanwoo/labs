'use client';

import { useCharacters } from '@features/admin/model/hooks';
import { ADMIN_ROUTE } from '@features/admin/model/services';
import { CharacterEditor } from '@features/admin/ui';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function CharacterDetailPage() {
  const id = useParams().id as string;
  const router = useRouter();
  const { data, isLoading } = useCharacters();
  const row = data?.find((c) => c.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link href={ADMIN_ROUTE.characters} className="text-xs text-muted btn-press">
          ←
        </Link>
        <h1 className="text-sm font-bold text-foreground">캐릭터 편집</h1>
      </div>

      {isLoading && <p className="text-xs text-muted text-center py-8">불러오는 중...</p>}
      {!isLoading && !row && <p className="text-xs text-red text-center py-8">찾을 수 없어요</p>}
      {row && <CharacterEditor row={row} onDone={() => router.push(ADMIN_ROUTE.characters)} />}
    </div>
  );
}
