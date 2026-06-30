'use client';

import { userProfileAtom } from '@entities/profile/model/store';
import type { Routine } from '@entities/routine/model/types';
import { computeProficiency } from '@entities/session/model/lib';
import { activeSessionAtom, levelUpAtom, sessionHistoryAtom } from '@entities/session/model/store';
import {
  INPUT_SOURCE,
  PERFORMANCE_STATUS,
  SESSION_STATUS,
  SET_STATUS,
  type ExercisePerformance,
  type SetStatus,
  type WorkoutSession,
} from '@entities/session/model/types';
import { notify, requestNotifyPermission, REST_DONE_VIBRATION, vibrate } from '@shared/lib';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildEmptySession, buildPerformance, buildSessionFromRoutine } from '../lib';

export const SESSION_VIEW = {
  list: 'list',
  exercise: 'exercise',
  resting: 'resting',
  summary: 'summary',
} as const;

export type SessionView = keyof typeof SESSION_VIEW;

const replacePerformance = (
  session: WorkoutSession,
  index: number,
  mutate: (performance: ExercisePerformance) => ExercisePerformance,
): WorkoutSession => ({
  ...session,
  performances: session.performances.map((performance, i) => (i === index ? mutate(performance) : performance)),
});

const resolveSetStatus = (reps: number, targetReps: number): SetStatus => {
  if (reps <= 0) {
    return SET_STATUS.skipped;
  }
  return reps >= targetReps ? SET_STATUS.done : SET_STATUS.partial;
};

const isResolved = (status: SetStatus): boolean => status !== SET_STATUS.pending;

type LogSetInput = {
  reps: number;
  weight: number;
};

export const useWorkoutSession = () => {
  const [session, setSession] = useAtom(activeSessionAtom);
  const [history, setHistory] = useAtom(sessionHistoryAtom);
  const [, setLevelUp] = useAtom(levelUpAtom);
  const [profile] = useAtom(userProfileAtom);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);

  const activePerformance = activeIndex === null ? null : (session?.performances[activeIndex] ?? null);
  const currentSetIndex = useMemo(
    () => (activePerformance ? activePerformance.sets.findIndex((set) => set.status === SET_STATUS.pending) : -1),
    [activePerformance],
  );

  const view = useMemo<SessionView | null>(() => {
    if (!session) {
      return null;
    }
    if (summaryOpen) {
      return SESSION_VIEW.summary;
    }
    if (activeIndex === null || !activePerformance) {
      return SESSION_VIEW.list;
    }
    return isResting ? SESSION_VIEW.resting : SESSION_VIEW.exercise;
  }, [session, summaryOpen, activeIndex, activePerformance, isResting]);

  const suggestedWeight = useMemo(() => {
    if (!activePerformance) {
      return 0;
    }
    if (currentSetIndex === 0) {
      return activePerformance.startWeight;
    }
    const reference = currentSetIndex > 0 ? currentSetIndex - 1 : activePerformance.sets.length - 1;
    return activePerformance.sets[reference]?.weight ?? activePerformance.startWeight;
  }, [activePerformance, currentSetIndex]);

  // 첫 세트는 목표 횟수, 이후는 직전 세트에 입력한 횟수를 이어받는다(무게와 동일하게).
  const suggestedReps = useMemo(() => {
    if (!activePerformance) {
      return 0;
    }
    if (currentSetIndex <= 0) {
      return activePerformance.targetReps;
    }
    const previousReps = activePerformance.sets[currentSetIndex - 1]?.reps ?? 0;
    return previousReps > 0 ? previousReps : activePerformance.targetReps;
  }, [activePerformance, currentSetIndex]);

  const doneCount = useMemo(
    () => session?.performances.filter((performance) => performance.status === PERFORMANCE_STATUS.done).length ?? 0,
    [session],
  );
  const total = session?.performances.length ?? 0;

  // 위에서부터 아직 끝내지 않은 첫 운동(없으면 -1) — '운동 시작'이 차례로 여는 대상.
  const nextPendingIndex = useMemo(
    () => session?.performances.findIndex((performance) => performance.status !== PERFORMANCE_STATUS.done) ?? -1,
    [session],
  );

  // 실제로 수행한 세트가 하나라도 있는지 — 없으면 '편집만 하고 나가기'로 본다.
  const hasLoggedSet = useMemo(
    () =>
      session?.performances.some((performance) =>
        performance.sets.some((set) => set.status === SET_STATUS.done || set.status === SET_STATUS.partial),
      ) ?? false,
    [session],
  );

  useEffect(() => {
    if (!isResting || restSecondsLeft <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => {
      if (restSecondsLeft <= 1) {
        setIsResting(false);
        setRestSecondsLeft(0);
        vibrate(REST_DONE_VIBRATION);
        notify('휴식 종료', '다음 세트를 시작하세요.');
        return;
      }
      setRestSecondsLeft(restSecondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isResting, restSecondsLeft]);

  const startRoutine = useCallback(
    (routine: Routine) => {
      setSession(
        buildSessionFromRoutine(routine, history, { defaultSets: profile.defaultSets, restSec: profile.restSec }),
      );
      setActiveIndex(null);
      setSummaryOpen(false);
      setIsResting(false);
      setRestSecondsLeft(0);
      requestNotifyPermission();
    },
    [history, profile.defaultSets, profile.restSec, setSession],
  );

  // 루틴 없이 빈 세션을 시작한다 — 자유 로깅의 진입점.
  const startEmpty = useCallback(() => {
    setSession(buildEmptySession(profile.goal));
    setActiveIndex(null);
    setSummaryOpen(false);
    setIsResting(false);
    setRestSecondsLeft(0);
    requestNotifyPermission();
  }, [profile.goal, setSession]);

  const openExercise = useCallback(
    (index: number) => {
      setIsResting(false);
      setRestSecondsLeft(0);
      setActiveIndex(index);
      setSession((prev) =>
        prev
          ? replacePerformance(prev, index, (performance) =>
              performance.status === PERFORMANCE_STATUS.pending
                ? { ...performance, status: PERFORMANCE_STATUS.active }
                : performance,
            )
          : prev,
      );
    },
    [setSession],
  );

  const backToList = useCallback(() => {
    setActiveIndex(null);
    setIsResting(false);
    setRestSecondsLeft(0);
  }, []);

  // 위에서부터 아직 안 끝낸 첫 운동을 연다(차례로 진행).
  const startNext = useCallback(() => {
    if (nextPendingIndex >= 0) {
      openExercise(nextPendingIndex);
    }
  }, [nextPendingIndex, openExercise]);

  const logCurrentSet = useCallback(
    ({ reps, weight }: LogSetInput) => {
      if (activeIndex === null || !activePerformance || currentSetIndex === -1) {
        return;
      }
      const hasMorePending = activePerformance.sets
        .slice(currentSetIndex + 1)
        .some((set) => set.status === SET_STATUS.pending);

      setSession((prev) => {
        if (!prev) {
          return prev;
        }
        return replacePerformance(prev, activeIndex, (performance) => {
          const setIndex = performance.sets.findIndex((set) => set.status === SET_STATUS.pending);
          const target = performance.sets[setIndex];
          if (!target) {
            return performance;
          }
          const safeReps = Math.max(0, Math.round(reps));
          const status = resolveSetStatus(safeReps, target.targetReps);
          const sets = performance.sets.map((set, i) =>
            i === setIndex ? { ...set, reps: safeReps, weight, status } : set,
          );
          const stillPending = sets.some((set) => set.status === SET_STATUS.pending);
          return { ...performance, sets, status: stillPending ? performance.status : PERFORMANCE_STATUS.done };
        });
      });

      if (hasMorePending) {
        setRestSecondsLeft(activePerformance.restSec);
        setIsResting(true);
      } else {
        backToList();
      }
    },
    [activeIndex, activePerformance, currentSetIndex, setSession, backToList],
  );

  const skipCurrentSet = useCallback(() => {
    if (activeIndex === null) {
      return;
    }
    let finished = false;
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      return replacePerformance(prev, activeIndex, (performance) => {
        const setIndex = performance.sets.findIndex((set) => set.status === SET_STATUS.pending);
        if (setIndex === -1) {
          return performance;
        }
        const sets = performance.sets.map((set, i) =>
          i === setIndex ? { ...set, reps: 0, status: SET_STATUS.skipped } : set,
        );
        const stillPending = sets.some((set) => set.status === SET_STATUS.pending);
        finished = !stillPending;
        return { ...performance, sets, status: stillPending ? performance.status : PERFORMANCE_STATUS.done };
      });
    });
    if (finished) {
      backToList();
    }
  }, [activeIndex, setSession, backToList]);

  const finishExercise = useCallback(() => {
    if (activeIndex === null) {
      return;
    }
    setSession((prev) =>
      prev
        ? replacePerformance(prev, activeIndex, (performance) => ({
            ...performance,
            status: PERFORMANCE_STATUS.done,
            sets: performance.sets.map((set) =>
              set.status === SET_STATUS.pending ? { ...set, status: SET_STATUS.skipped } : set,
            ),
          }))
        : prev,
    );
    backToList();
  }, [activeIndex, setSession, backToList]);

  const addSet = useCallback(() => {
    if (activeIndex === null) {
      return;
    }
    setSession((prev) =>
      prev
        ? replacePerformance(prev, activeIndex, (performance) => {
            const last = performance.sets.at(-1);
            return {
              ...performance,
              status: PERFORMANCE_STATUS.active,
              sets: [
                ...performance.sets,
                {
                  setIndex: performance.sets.length,
                  targetReps: performance.targetReps,
                  reps: performance.targetReps,
                  weight: last?.weight ?? performance.startWeight,
                  status: SET_STATUS.pending,
                  restSec: performance.restSec,
                  inputSource: INPUT_SOURCE.manual,
                },
              ],
            };
          })
        : prev,
    );
  }, [activeIndex, setSession]);

  const substituteExercise = useCallback(
    (alternativeId: string) => {
      if (activeIndex === null) {
        return;
      }
      setSession((prev) =>
        prev
          ? replacePerformance(prev, activeIndex, (performance) => ({
              ...performance,
              substitutedFrom: performance.substitutedFrom ?? performance.exerciseId,
              exerciseId: alternativeId,
            }))
          : prev,
      );
    },
    [activeIndex, setSession],
  );

  const addExercise = useCallback(
    (exerciseId: string) => {
      setSession((prev) =>
        prev
          ? {
              ...prev,
              performances: [
                ...prev.performances,
                buildPerformance(exerciseId, prev.goal, prev.performances.length + 1, {
                  defaultSets: profile.defaultSets,
                  restSec: profile.restSec,
                }),
              ],
            }
          : prev,
      );
    },
    [profile.defaultSets, profile.restSec, setSession],
  );

  const removeExercise = useCallback(
    (index: number) => {
      setSession((prev) => (prev ? { ...prev, performances: prev.performances.filter((_, i) => i !== index) } : prev));
    },
    [setSession],
  );

  // 목록에서 그 자리 운동을 다른 종목으로 교체(세트 구성은 프로필 기준으로 새로).
  const replaceExercise = useCallback(
    (index: number, exerciseId: string) => {
      setSession((prev) => {
        if (!prev) {
          return prev;
        }
        const current = prev.performances[index];
        if (!current) {
          return prev;
        }
        const replacement = buildPerformance(exerciseId, prev.goal, current.order, {
          defaultSets: profile.defaultSets,
          restSec: profile.restSec,
        });
        return { ...prev, performances: prev.performances.map((p, i) => (i === index ? replacement : p)) };
      });
    },
    [profile.defaultSets, profile.restSec, setSession],
  );

  // 드래그로 임의 위치 재정렬.
  const reorderExercise = useCallback(
    (from: number, to: number) => {
      setSession((prev) => {
        if (!prev) {
          return prev;
        }
        const list = [...prev.performances];
        const [moved] = list.splice(from, 1);
        if (!moved) {
          return prev;
        }
        list.splice(to, 0, moved);
        return { ...prev, performances: list };
      });
    },
    [setSession],
  );

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestSecondsLeft(0);
  }, []);

  const addRest = useCallback((seconds: number) => {
    setRestSecondsLeft((value) => Math.max(0, value + seconds));
  }, []);

  const openSummary = useCallback(() => setSummaryOpen(true), []);
  const closeSummary = useCallback(() => setSummaryOpen(false), []);

  const commitSession = useCallback(() => {
    if (!session) {
      return;
    }
    const finished: WorkoutSession = { ...session, status: SESSION_STATUS.done, endedAt: new Date().toISOString() };
    // 이번 기록으로 레벨이 오르면 축하 오버레이를 띄운다.
    const before = computeProficiency(history);
    const after = computeProficiency([...history, finished]);
    if (after.level > before.level) {
      setLevelUp({ level: after.level, name: after.name });
    }
    setHistory((entries) => [...entries, finished]);
    setSession(null);
  }, [session, history, setHistory, setLevelUp, setSession]);

  const resetRunnerState = useCallback(() => {
    setActiveIndex(null);
    setSummaryOpen(false);
    setIsResting(false);
    setRestSecondsLeft(0);
  }, []);

  const abortSession = useCallback(() => {
    if (!session) {
      return;
    }
    const finished: WorkoutSession = { ...session, status: SESSION_STATUS.aborted, endedAt: new Date().toISOString() };
    setHistory((entries) => [...entries, finished]);
    setSession(null);
    resetRunnerState();
  }, [session, setHistory, setSession, resetRunnerState]);

  // 수행 기록 없이 세션을 폐기한다(편집만 하고 나가기). history에 남기지 않는다.
  const discardSession = useCallback(() => {
    setSession(null);
    resetRunnerState();
  }, [setSession, resetRunnerState]);

  const allResolved = total > 0 && doneCount === total;

  return {
    session,
    view,
    activePerformance,
    currentSetIndex,
    suggestedWeight,
    suggestedReps,
    isResting,
    restSecondsLeft,
    doneCount,
    total,
    nextPendingIndex,
    hasLoggedSet,
    allResolved,
    isSetResolved: isResolved,
    startRoutine,
    startEmpty,
    openExercise,
    startNext,
    backToList,
    logCurrentSet,
    skipCurrentSet,
    finishExercise,
    addSet,
    substituteExercise,
    addExercise,
    removeExercise,
    replaceExercise,
    reorderExercise,
    skipRest,
    addRest,
    openSummary,
    closeSummary,
    commitSession,
    abortSession,
    discardSession,
  };
};
