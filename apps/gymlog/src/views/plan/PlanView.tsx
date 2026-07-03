'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import { buildWeeklyPlanForSplit, type DayPlan } from '@entities/profile/model/types';
import { routineDraftAtom, savedRoutinesAtom } from '@entities/routine/model/store';
import { WeeklyPlanEditor } from '@features/workout-plan/ui';
import { useMounted } from '@shared/lib';
import { Button } from '@ui/react';
import { AppHeader } from '@widgets/app-header/ui';
import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PlanView() {
  const router = useRouter();
  const mounted = useMounted();
  const [profile, setProfile] = useAtom(userProfileAtom);
  const [savedRoutines] = useAtom(savedRoutinesAtom);
  const setRoutineDraft = useSetAtom(routineDraftAtom);

  // 주간 플랜도 설정과 동일하게 로컬 draft로 편집하고, '저장'을 눌러야 커밋(→ 1회 영속)한다.
  const [draft, setDraft] = useState(profile);
  const [lastSaved, setLastSaved] = useState(profile);
  if (profile !== lastSaved) {
    setLastSaved(profile);
    setDraft(profile);
  }

  const handleNewRoutine = () => {
    setRoutineDraft(null);
    router.push('/routines/new');
  };

  const handleChange = (weekday: number, dayPlan: DayPlan) => {
    setDraft((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((plan, index) => (index === weekday ? dayPlan : plan)),
    }));
  };

  const handleReset = () => setDraft((prev) => ({ ...prev, weekPlan: buildWeeklyPlanForSplit(prev.split) }));
  const isDirty = JSON.stringify(draft.weekPlan) !== JSON.stringify(profile.weekPlan);
  const handleSavePlan = () => setProfile(draft);

  return (
    <>
      <AppHeader title="주간 플랜" />
      <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-3xl pt-lg">
        {mounted ? (
          <>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">요일별</strong>로 그날 운동할 부위를 정하세요. 자율은 그날 직접
              고르고, 휴식은 쉬는 날이에요.
            </p>
            <WeeklyPlanEditor weekPlan={draft.weekPlan} routines={savedRoutines} onChange={handleChange} />

            <div className="flex flex-col gap-xs">
              <Button className="h-12 w-full" disabled={!isDirty} onClick={handleSavePlan}>
                {isDirty ? '변경사항 저장' : '저장됨'}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isDirty ? '저장하지 않은 변경이 있어요.' : '모든 변경이 저장됐어요.'}
              </p>
            </div>

            <div className="flex flex-col gap-sm rounded-lg border border-card-border bg-glass p-lg">
              <span className="text-sm font-medium text-foreground">부위별 루틴으로 만들고 싶다면?</span>
              <span className="text-sm text-muted-foreground">
                가슴 루틴·등 루틴처럼 종목까지 직접 짜서 저장하고, 원하는 날 골라서 하세요.
              </span>
              <button
                type="button"
                onClick={handleNewRoutine}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-lg text-sm font-semibold text-primary-foreground"
              >
                부위별 루틴 만들기
              </button>
            </div>

            <Button variant="outline" className="h-11 w-full" onClick={handleReset}>
              분할 템플릿으로 초기화
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">불러오는 중…</p>
        )}
      </main>
    </>
  );
}
