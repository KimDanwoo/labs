'use client';

import { getExerciseById } from '@entities/exercise/model/constants';
import { SESSION_VIEW, useWorkoutSession } from '@features/session-runner/model/hooks';
import {
  AddExerciseList,
  ExercisePanel,
  RestTimer,
  RunnerHeader,
  SessionExerciseList,
  SessionSummaryCard,
} from '@features/session-runner/ui';
import { Button } from '@ui/react';
import * as Card from '@ui/react/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SessionView() {
  const router = useRouter();
  const runner = useWorkoutSession();
  const [showAdd, setShowAdd] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const { session, view } = runner;

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center gap-lg px-lg py-3xl">
        <Card.Root className="w-full">
          <Card.Header>
            <Card.Title>진행 중인 운동이 없어요</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-sm text-muted">루틴을 선택해서 운동을 시작해보세요.</p>
            <Link href="/">
              <Button className="h-14 w-full">홈으로</Button>
            </Link>
          </Card.Body>
        </Card.Root>
      </main>
    );
  }

  // 한 세트도 안 했으면 기록 없이 폐기(편집만 하고 나가기), 진행분이 있으면 저장 여부를 확인한다.
  const handleExit = () => {
    if (!runner.hasLoggedSet) {
      runner.discardSession();
      router.push('/');
      return;
    }
    if (window.confirm('지금까지 한 기록을 저장하고 종료할까요? 취소하면 계속 운동해요.')) {
      runner.abortSession();
      router.push('/');
    }
  };
  const handleCommit = () => {
    runner.commitSession();
    router.push('/history');
  };

  if (view === SESSION_VIEW.summary) {
    return (
      <main className="mx-auto w-full max-w-content px-lg py-3xl">
        <SessionSummaryCard session={session} onCommit={handleCommit} />
        <Button variant="ghost" className="mt-md h-12 w-full text-sm text-muted" onClick={runner.closeSummary}>
          계속 운동하기
        </Button>
      </main>
    );
  }

  if (view === SESSION_VIEW.exercise && runner.activePerformance) {
    return (
      <main className="mx-auto w-full max-w-content px-lg py-3xl">
        <ExercisePanel
          performance={runner.activePerformance}
          currentSetIndex={runner.currentSetIndex}
          suggestedWeight={runner.suggestedWeight}
          suggestedReps={runner.suggestedReps}
          onLog={runner.logCurrentSet}
          onSkip={runner.skipCurrentSet}
          onFinish={runner.finishExercise}
          onAddSet={runner.addSet}
          onBack={runner.backToList}
          onSubstitute={runner.substituteExercise}
        />
      </main>
    );
  }

  if (view === SESSION_VIEW.resting) {
    return (
      <main className="mx-auto flex w-full max-w-content flex-col gap-3xl px-lg py-3xl">
        <RestTimer
          restSecondsLeft={runner.restSecondsLeft}
          nextSetIndex={runner.currentSetIndex + 1}
          onAddRest={runner.addRest}
          onSkipRest={runner.skipRest}
        />
        <Button variant="ghost" className="h-10 w-full text-sm text-muted" onClick={runner.backToList}>
          목록으로
        </Button>
      </main>
    );
  }

  const nextPerformance = runner.nextPendingIndex >= 0 ? session.performances[runner.nextPendingIndex] : null;
  const nextName = nextPerformance ? getExerciseById(nextPerformance.exerciseId)?.nameKo : null;
  const allDone = runner.nextPendingIndex < 0;
  const startLabel = nextName ? `${nextName} 시작` : '운동 시작';

  return (
    <>
      <RunnerHeader
        routineName={session.routineName}
        doneCount={runner.doneCount}
        total={runner.total}
        onExit={handleExit}
      />
      <main className="mx-auto flex w-full max-w-content flex-col gap-lg px-lg pb-3xl pt-lg">
        <p className="text-sm text-muted">
          아무 운동이나 눌러 시작하세요. ⠿ 순서 변경 · ✎ 바꾸기 · ✕ 빼기, 아래에서 추가할 수 있어요.
        </p>
        <SessionExerciseList
          performances={session.performances}
          onOpen={runner.openExercise}
          onRemove={runner.removeExercise}
          onSwap={(index) => {
            setSwapIndex(index);
            setShowAdd(false);
          }}
          onReorder={runner.reorderExercise}
        />

        {swapIndex !== null && (
          <div className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">운동 바꾸기</span>
              <Button variant="ghost" className="h-8 px-md text-sm text-muted" onClick={() => setSwapIndex(null)}>
                취소
              </Button>
            </div>
            <AddExerciseList
              onAdd={(exerciseId) => {
                runner.replaceExercise(swapIndex, exerciseId);
                setSwapIndex(null);
              }}
            />
          </div>
        )}

        {swapIndex === null && showAdd && (
          <AddExerciseList
            onAdd={(exerciseId) => {
              runner.addExercise(exerciseId);
              setShowAdd(false);
            }}
          />
        )}

        {swapIndex === null && !showAdd && (
          <Button variant="outline" className="h-12 w-full" onClick={() => setShowAdd(true)}>
            + 운동 추가
          </Button>
        )}

        {!allDone && (
          <Button className="h-14 w-full text-base font-semibold" onClick={runner.startNext}>
            {startLabel}
          </Button>
        )}
        <Button
          variant={allDone ? undefined : 'outline'}
          className={allDone ? 'h-14 w-full text-base font-semibold' : 'h-12 w-full'}
          onClick={runner.openSummary}
        >
          운동 끝내기
        </Button>
      </main>
    </>
  );
}
