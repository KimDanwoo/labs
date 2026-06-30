'use client';

import { routineDraftAtom, savedRoutinesAtom, sharedRoutinesAtom } from '@entities/routine/model/store';
import type { Routine } from '@entities/routine/model/types';
import { useWorkoutSession } from '@features/session-runner/model/hooks';
import { useMounted } from '@shared/lib';
import { AppHeader } from '@widgets/app-header/ui';
import { MyRoutineList } from '@widgets/my-routines/ui';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';

export function RoutineLibraryView() {
  const router = useRouter();
  const mounted = useMounted();
  const [saved, setSaved] = useAtom(savedRoutinesAtom);
  const shared = useAtomValue(sharedRoutinesAtom);
  const setDraft = useSetAtom(routineDraftAtom);
  const { startRoutine } = useWorkoutSession();

  const handleStart = (routine: Routine) => {
    startRoutine(routine);
    router.push('/session');
  };
  const handleEdit = (routine: Routine) => router.push(`/routines/${routine.id}/edit`);
  const handleDelete = (routine: Routine) => {
    if (window.confirm(`'${routine.name}' 루틴을 삭제할까요?`)) {
      setSaved((prev) => prev.filter((item) => item.id !== routine.id));
    }
  };
  // 기본 루틴을 내 루틴으로 복제해 편집기로 가져간다(담기).
  const handleClone = (routine: Routine) => {
    setDraft({ ...routine, id: crypto.randomUUID(), source: 'custom' });
    router.push('/routines/new');
  };
  const handleNew = () => {
    setDraft(null);
    router.push('/routines/new');
  };

  return (
    <>
      <AppHeader title="루틴 관리" />
      <main className="mx-auto flex w-full max-w-content flex-col gap-2xl px-lg pb-28 pt-lg">
        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">내 루틴</h2>
            <button type="button" onClick={handleNew} className="text-sm font-medium text-primary hover:underline">
              + 새 루틴
            </button>
          </div>
          {!mounted && <p className="text-muted">불러오는 중…</p>}
          {mounted && saved.length > 0 && (
            <MyRoutineList routines={saved} onStart={handleStart} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          {mounted && saved.length === 0 && (
            <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted">
              아직 만든 루틴이 없어요. 아래 기본 루틴을 담거나 새로 만들어 보세요.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-md">
          <h2 className="text-base font-semibold text-foreground">기본 루틴</h2>
          <MyRoutineList routines={shared} onStart={handleStart} onEdit={handleClone} editLabel="담기" />
        </section>
      </main>
    </>
  );
}
