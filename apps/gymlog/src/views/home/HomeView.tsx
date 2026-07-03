'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import { getDayPlan, WEEKDAY_LABELS } from '@entities/profile/model/types';
import { routineDraftAtom, savedRoutinesAtom, sharedRoutinesAtom } from '@entities/routine/model/store';
import type { Routine } from '@entities/routine/model/types';
import { sessionHistoryAtom } from '@entities/session/model/store';
import { SESSION_STATUS } from '@entities/session/model/types';
import { useWorkoutSession } from '@features/session-runner/model/hooks';
import { buildRoutineFromMuscles } from '@features/workout-plan/model/lib';
import { TodayWorkout } from '@features/workout-plan/ui';
import { isSameDay, useMounted } from '@shared/lib';
import { Badge, Button, Card } from '@ui/react';
import { AppHeader } from '@widgets/app-header/ui';
import { LevelCard } from '@widgets/level-card/ui';
import { MyRoutineList } from '@widgets/my-routines/ui';
import { RoutinePicker } from '@widgets/routine-picker/ui';
import { useAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export function HomeView() {
  const router = useRouter();
  const mounted = useMounted();
  const [profile] = useAtom(userProfileAtom);
  const [savedRoutines] = useAtom(savedRoutinesAtom);
  const [sharedRoutines] = useAtom(sharedRoutinesAtom);
  const [history] = useAtom(sessionHistoryAtom);
  const [, setRoutineDraft] = useAtom(routineDraftAtom);
  const { startRoutine, startEmpty } = useWorkoutSession();

  const needsOnboarding = mounted && !profile.onboarded;

  // 오늘 완료한 운동이 있으면 홈을 '완료' 상태로 간결하게 보여준다.
  const todayCompleted = useMemo(
    () =>
      history.some(
        (session) => session.status === SESSION_STATUS.done && isSameDay(new Date(session.startedAt), new Date()),
      ),
    [history],
  );

  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [needsOnboarding, router]);

  function handleStart(routine: Routine): void {
    startRoutine(routine);
    router.push('/session');
  }
  // 루틴 없이 빈 세션으로 시작 — 종목을 검색해 추가하며 기록(자유 로깅).
  const handleStartEmpty = () => {
    startEmpty();
    router.push('/session');
  };
  const handleEdit = (routine: Routine) => router.push(`/routines/${routine.id}/edit`);
  // 빈 새 루틴 — 혹시 남아있는 편집 시드를 비우고 시작.
  const handleNewRoutine = () => {
    setRoutineDraft(null);
    router.push('/routines/new');
  };
  // 오늘 자동 구성을 편집기로 가져가 자유롭게 빼고/추가한 뒤 내 루틴으로 저장.
  const handleEditToday = (routine: Routine) => {
    setRoutineDraft({ ...routine, id: crypto.randomUUID() });
    router.push('/routines/new');
  };

  if (!mounted || needsOnboarding) {
    return <main className="mx-auto w-full max-w-mobile px-lg py-3xl text-muted-foreground">불러오는 중…</main>;
  }

  if (todayCompleted) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-28 pt-lg">
          <LevelCard />
          <Card>
            <Card.Header>
              <Badge>오늘 완료</Badge>
            </Card.Header>
            <Card.Title>오늘의 운동을 완료했어요 💪</Card.Title>
            <Card.Description>푹 쉬고 회복하는 것도 운동의 일부예요.</Card.Description>
            <Card.Content>
              <Link href="/history">
                <Button variant="outline" className="h-12 w-full">
                  기록 보기
                </Button>
              </Link>
            </Card.Content>
          </Card>
        </main>
      </>
    );
  }

  const weekday = new Date().getDay();
  const dayPlan = getDayPlan(profile.weekPlan, weekday);
  // routine 요일이면 배정한 저장 루틴을, focus 요일이면 부위로 자동 구성한 루틴을 오늘의 운동으로.
  const resolveTodayRoutine = (): Routine | null => {
    if (dayPlan.type === 'routine' && dayPlan.routineId) {
      return savedRoutines.find((routine) => routine.id === dayPlan.routineId) ?? null;
    }
    if (dayPlan.type === 'focus' && dayPlan.muscles.length > 0) {
      return buildRoutineFromMuscles(dayPlan.muscles, profile.goal, `today-${weekday}`);
    }
    return null;
  };
  const todayRoutine = resolveTodayRoutine();

  const hasSaved = savedRoutines.length > 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-mobile flex-col gap-lg px-lg pb-28 pt-lg">
        <LevelCard />

        <TodayWorkout
          weekdayLabel={WEEKDAY_LABELS[weekday] ?? ''}
          dayPlan={dayPlan}
          routine={todayRoutine}
          onStart={handleStart}
          onEdit={dayPlan.type === 'routine' ? handleEdit : handleEditToday}
          onPickFree={handleNewRoutine}
        />

        <Button
          variant="ghost"
          className="h-11 w-full text-sm font-medium text-muted-foreground"
          onClick={handleStartEmpty}
        >
          루틴 없이 바로 기록하기
        </Button>

        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{hasSaved ? '내 루틴' : '추천 루틴'}</h2>
            <button
              type="button"
              onClick={handleNewRoutine}
              className="text-sm font-medium text-primary hover:underline"
            >
              + 새 루틴
            </button>
          </div>

          {hasSaved ? (
            <MyRoutineList routines={savedRoutines} onStart={handleStart} onEdit={handleEdit} />
          ) : (
            <RoutinePicker routines={sharedRoutines} onStart={handleStart} />
          )}
        </div>
      </main>
    </>
  );
}
