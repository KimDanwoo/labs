import { FIGHT_GAUGE_MAX, TENSION } from '../config/fishing';
import { FISH, FISH_SHAPE, isRareFish } from './fishTable';

export const FIGHT_OUTCOME = { active: 'active', landed: 'landed', snapped: 'snapped', escaped: 'escaped' } as const;
export type Fight = {
  tension: number;
  progress: number;
  elapsed: number;
  outcome: (typeof FIGHT_OUTCOME)[keyof typeof FIGHT_OUTCOME];
};
export function startFight(isPerfect: boolean): Fight {
  return { tension: 40, progress: isPerfect ? 20 : 10, elapsed: 0, outcome: FIGHT_OUTCOME.active };
}
export function fishSurge(id: string, elapsed: number) {
  const index = Math.max(
    0,
    FISH.findIndex((fish) => fish.id === id),
  );
  const fish = FISH[index]!;
  let speed = 2.8;
  if (fish.shape === FISH_SHAPE.flat) speed = 1.4;
  if (fish.shape === FISH_SHAPE.round) speed = 1.9;
  return Math.sin(elapsed * (speed + index * 0.035) + index * 0.7) > (isRareFish(id) ? 0.2 : 0.45);
}
export function stepFight(state: Fight, isReeling: boolean, seconds: number, size: number, id = 'goby'): Fight {
  if (state.outcome !== FIGHT_OUTCOME.active) return state;
  const dt = Math.max(0, Math.min(0.1, seconds));
  const elapsed = state.elapsed + dt;
  const strength = Math.min(1, size / 65);
  const surge = fishSurge(id, elapsed);
  const tension = Math.max(
    0,
    Math.min(
      FIGHT_GAUGE_MAX,
      state.tension + (isReeling ? 23 + strength * 12 + (surge ? 20 : 0) : -30 + (surge ? 12 : 0)) * dt,
    ),
  );
  const progress = Math.max(
    0,
    Math.min(
      FIGHT_GAUGE_MAX,
      state.progress + (isReeling && tension >= TENSION.low && tension <= TENSION.high ? 28 - strength * 8 : -3) * dt,
    ),
  );
  let outcome: Fight['outcome'] = FIGHT_OUTCOME.active;
  if (tension >= FIGHT_GAUGE_MAX) outcome = FIGHT_OUTCOME.snapped;
  else if (tension <= 0 || progress <= 0) outcome = FIGHT_OUTCOME.escaped;
  else if (progress >= FIGHT_GAUGE_MAX) outcome = FIGHT_OUTCOME.landed;
  return { tension, progress, elapsed, outcome };
}
