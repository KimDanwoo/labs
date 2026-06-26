import { SET_STATUS, type WorkoutSession } from '../types/session';

export type SessionSummary = {
  exerciseCount: number;
  completedSets: number;
  totalReps: number;
  totalVolumeKg: number;
  totalRestSec: number;
  durationSec: number;
};

const isCounted = (status: string): boolean => status === SET_STATUS.done || status === SET_STATUS.partial;

export const summarizeSession = (session: WorkoutSession): SessionSummary => {
  const countedSets = session.performances.flatMap((performance) =>
    performance.sets.filter((set) => isCounted(set.status)),
  );

  const totalReps = countedSets.reduce((sum, set) => sum + set.reps, 0);
  const totalVolumeKg = countedSets.reduce((sum, set) => sum + set.reps * set.weight, 0);
  const totalRestSec = countedSets.reduce((sum, set) => sum + set.restSec, 0);

  const startedAt = new Date(session.startedAt).getTime();
  const endedAt = session.endedAt ? new Date(session.endedAt).getTime() : startedAt;
  const durationSec = Math.max(0, Math.round((endedAt - startedAt) / 1000));

  return {
    exerciseCount: session.performances.filter((performance) => performance.sets.some((set) => isCounted(set.status)))
      .length,
    completedSets: countedSets.length,
    totalReps,
    totalVolumeKg,
    totalRestSec,
    durationSec,
  };
};
