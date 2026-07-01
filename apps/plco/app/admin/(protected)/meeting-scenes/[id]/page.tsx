'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ALL_CHARACTER_IDS } from '@shared/constants';
import { ADMIN_ROUTE } from '@app/admin/_lib/api';
import { useMeetingScenes } from '@app/admin/_lib/hooks';
import type { MeetingSceneRow } from '@app/admin/_lib/types';
import SceneEditor from '../SceneEditor';

function emptyScene(): MeetingSceneRow {
  return {
    id: '',
    character_id: ALL_CHARACTER_IDS[0],
    category: 'food',
    prompt: '',
    options: [
      { text: '', outcome: 'good', reaction: '' },
      { text: '', outcome: 'ok', reaction: '' },
      { text: '', outcome: 'awkward', reaction: '' },
    ],
    is_active: true,
    sort_order: 0,
  };
}

export default function SceneDetailPage() {
  const id = useParams().id as string;
  const router = useRouter();
  const isNew = id === 'new';
  const { data, isLoading } = useMeetingScenes();

  const back = () => router.push(ADMIN_ROUTE.meetingScenes);
  const row = isNew ? emptyScene() : data?.find((r) => r.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href={ADMIN_ROUTE.meetingScenes}
          className="text-xs text-muted btn-press"
        >
          ←
        </Link>
        <h1 className="text-sm font-bold text-foreground">
          {isNew ? '새 시나리오' : '시나리오 편집'}
        </h1>
      </div>

      {!isNew && isLoading && (
        <p className="text-xs text-muted text-center py-8">불러오는 중...</p>
      )}
      {!isNew && !isLoading && !row && (
        <p className="text-xs text-red text-center py-8">찾을 수 없어요</p>
      )}
      {row && <SceneEditor row={row} onDone={back} />}
    </div>
  );
}
