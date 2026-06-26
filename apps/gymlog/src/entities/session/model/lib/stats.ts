import { SET_STATUS, type WorkoutSession } from '../types/session';

const isCounted = (status: WorkoutSession['performances'][number]['sets'][number]['status']): boolean =>
  status === SET_STATUS.done || status === SET_STATUS.partial;

// 모든 수행 세트의 무게×횟수 합(kg) — 누적 들어올린 총량.
export const computeTotalVolume = (sessions: WorkoutSession[]): number =>
  sessions.reduce(
    (total, session) =>
      total +
      session.performances.reduce(
        (perfSum, performance) =>
          perfSum +
          performance.sets.reduce(
            (setSum, set) => (isCounted(set.status) ? setSum + set.weight * set.reps : setSum),
            0,
          ),
        0,
      ),
    0,
  );

// reference 기준 최근 days일(당일 포함) 동안의 운동 수.
export const countRecentSessions = (sessions: WorkoutSession[], days: number, reference: Date): number => {
  const cutoff = new Date(reference);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return sessions.filter((session) => new Date(session.startedAt) >= cutoff).length;
};
