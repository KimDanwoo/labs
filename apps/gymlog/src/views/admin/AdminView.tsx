'use client';

import { PRESET_ROUTINES } from '@entities/routine/model/constants';
import { savedRoutinesAtom, sharedRoutinesAtom } from '@entities/routine/model/store';
import { ROUTINE_SOURCE, type Routine } from '@entities/routine/model/types';
import { firebaseUserAtom } from '@entities/user/model/store';
import { RoutineBuilderForm } from '@features/routine-builder/ui';
import { sharedRoutineDoc } from '@shared/firebase';
import { Button } from '@ui/react';
import { AppHeader } from '@widgets/app-header/ui';
import { deleteDoc, setDoc } from 'firebase/firestore';
import { useAtom, useAtomValue } from 'jotai';
import { useState } from 'react';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

type Editing = Routine | 'new' | null;

export function AdminView() {
  const user = useAtomValue(firebaseUserAtom);
  const [shared, setShared] = useAtom(sharedRoutinesAtom);
  const saved = useAtomValue(savedRoutinesAtom);
  const [editing, setEditing] = useState<Editing>(null);

  const isAdmin = Boolean(ADMIN_UID) && user?.uid === ADMIN_UID;

  // 공용 루틴 저장(신규·수정 공통). source는 항상 preset으로 고정.
  const upsertShared = (routine: Routine) => {
    const entry: Routine = { ...routine, source: ROUTINE_SOURCE.preset };
    void setDoc(sharedRoutineDoc(entry.id), entry).then(() => {
      setShared((prev) => [...prev.filter((item) => item.id !== entry.id), entry]);
      setEditing(null);
    });
  };

  const handleDelete = (routine: Routine) => {
    if (!window.confirm(`공용 루틴 '${routine.name}'을 삭제할까요?`)) {
      return;
    }
    void deleteDoc(sharedRoutineDoc(routine.id)).then(() =>
      setShared((prev) => prev.filter((item) => item.id !== routine.id)),
    );
  };

  // 내 루틴을 공용으로 복사(새 id로).
  const handlePromote = (routine: Routine) => upsertShared({ ...routine, id: crypto.randomUUID() });

  const handleSeedPresets = () => {
    void Promise.all(PRESET_ROUTINES.map((routine) => setDoc(sharedRoutineDoc(routine.id), routine))).then(() =>
      setShared([...PRESET_ROUTINES]),
    );
  };

  if (!isAdmin) {
    return (
      <>
        <AppHeader title="관리자" />
        <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-3xl text-center">
          <p className="text-muted">관리자만 접근할 수 있어요.</p>
        </main>
      </>
    );
  }

  if (editing !== null) {
    return (
      <>
        <AppHeader title={editing === 'new' ? '새 공용 루틴' : '공용 루틴 수정'} showNav={false} />
        <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-lg">
          <RoutineBuilderForm
            key={editing === 'new' ? 'new' : editing.id}
            initialRoutine={editing === 'new' ? null : editing}
            hideStart
            onSubmit={(routine) => upsertShared(routine)}
          />
          <Button variant="ghost" className="h-10 w-full text-sm text-muted" onClick={() => setEditing(null)}>
            취소
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="루틴 관리(관리자)" showNav={false} />
      <main className="mx-auto flex w-full max-w-content flex-col gap-2xl px-lg pb-3xl pt-lg">
        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">공용 루틴 ({shared.length})</h2>
            <div className="flex gap-sm">
              <Button variant="outline" className="h-9 px-md text-sm" onClick={() => setEditing('new')}>
                + 새 루틴
              </Button>
              <Button variant="ghost" className="h-9 px-md text-sm text-muted" onClick={handleSeedPresets}>
                PRESET 시드
              </Button>
            </div>
          </div>
          {shared.length === 0 ? (
            <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted">
              공용 루틴이 없어요. + 새 루틴으로 만들거나 PRESET 시드하세요.
            </p>
          ) : (
            shared.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between gap-sm rounded-lg border border-card-border bg-glass p-md"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{routine.name}</span>
                <Button variant="outline" className="h-8 shrink-0 px-md text-sm" onClick={() => setEditing(routine)}>
                  수정
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 shrink-0 px-md text-sm text-error"
                  onClick={() => handleDelete(routine)}
                >
                  삭제
                </Button>
              </div>
            ))
          )}
        </section>

        <section className="flex flex-col gap-md">
          <h2 className="text-base font-semibold text-foreground">내 루틴을 공용으로</h2>
          {saved.length === 0 ? (
            <p className="rounded-lg border border-card-border bg-glass p-lg text-sm text-muted">
              먼저 루틴을 만들면 여기서 공용으로 올릴 수 있어요.
            </p>
          ) : (
            saved.map((routine) => (
              <div
                key={routine.id}
                className="flex items-center justify-between rounded-lg border border-card-border bg-glass p-md"
              >
                <span className="truncate text-sm font-medium text-foreground">{routine.name}</span>
                <Button variant="outline" className="h-8 shrink-0 px-md text-sm" onClick={() => handlePromote(routine)}>
                  공용 추가
                </Button>
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
