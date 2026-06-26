'use client';

import { routineDraftAtom, savedRoutinesAtom } from '@entities/routine/model/store';
import type { Routine } from '@entities/routine/model/types';
import { RoutineBuilderForm } from '@features/routine-builder/ui';
import { useWorkoutSession } from '@features/session-runner/model/hooks';
import { useMounted } from '@shared/lib';
import { Button } from '@ui/react';
import { AppHeader } from '@widgets/app-header/ui';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';

type RoutineBuilderViewProps = {
  routineId?: string;
};

export function RoutineBuilderView({ routineId }: RoutineBuilderViewProps) {
  const router = useRouter();
  const mounted = useMounted();
  const [saved, setSaved] = useAtom(savedRoutinesAtom);
  const [draftSeed, setDraftSeed] = useAtom(routineDraftAtom);
  const { startRoutine } = useWorkoutSession();

  const savedEditing = routineId ? (saved.find((routine) => routine.id === routineId) ?? null) : null;
  const editing = savedEditing ?? draftSeed;
  // 없는 루틴 id로 편집에 직접 진입한 경우(삭제됐거나 잘못된 주소).
  const isMissing = mounted && Boolean(routineId) && !savedEditing;

  const resolveTitle = (): string => {
    if (routineId) {
      return '루틴 수정';
    }
    return draftSeed ? '운동 편집' : '새 루틴 만들기';
  };

  const handleSubmit = (routine: Routine, start: boolean) => {
    setSaved((prev) => {
      const exists = prev.some((item) => item.id === routine.id);
      return exists ? prev.map((item) => (item.id === routine.id ? routine : item)) : [...prev, routine];
    });
    setDraftSeed(null);
    if (start) {
      startRoutine(routine);
      router.push('/session');
      return;
    }
    router.push('/');
  };

  return (
    <>
      <AppHeader title={resolveTitle()} showNav={false} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-lg">
        {!mounted && <p className="text-muted">불러오는 중…</p>}

        {isMissing && (
          <div className="flex flex-col items-center gap-lg pt-3xl text-center">
            <p className="text-muted">루틴을 찾을 수 없어요. 삭제됐거나 주소가 바뀌었어요.</p>
            <Button className="h-12 w-full" onClick={() => router.push('/')}>
              홈으로
            </Button>
          </div>
        )}

        {mounted && !isMissing && (
          <RoutineBuilderForm
            key={routineId ?? (draftSeed ? `seed-${draftSeed.id}` : 'new')}
            initialRoutine={editing}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </>
  );
}
