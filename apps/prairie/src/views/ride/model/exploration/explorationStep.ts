import { centers } from '@views/ride/lib/exploration/explorationScene';
import { terrainHeightAt } from '@views/ride/lib/scene/terrain';
import { getExploration, saveExploration, updateExploration } from '@views/ride/model/exploration/store';
import { crossesGate, LANDMARKS } from '@views/ride/model/exploration/world';
import { runnerState } from '@views/ride/model/ride-state/runnerState';
import { Vector3 } from 'three';

type Snapshot = ReturnType<typeof getExploration>;

export interface ExplorationTracker {
  previous: Vector3;
  body: Vector3;
  isInitialized: boolean;
  elapsed: number;
  noticeUntil: number;
  lastNotice: string;
}

const TORSO_HEIGHT = 1.3;
const LANDMARK_HEIGHT_RANGE = 38;
const MAX_TIMER_DELTA = 0.1;
const MIN_RESULT = 0.1;
const TENTH = 10;
const NOTICE_SECONDS = 6;

export function createExplorationTracker(): ExplorationTracker {
  return {
    previous: new Vector3(),
    body: new Vector3(),
    isInitialized: false,
    elapsed: 0,
    noticeUntil: 0,
    lastNotice: '',
  };
}

const roundTenth = (value: number) => Math.round(value * TENTH) / TENTH;
const floorTenth = (value: number) => Math.floor(value * TENTH) / TENTH;

function recordNearby(position: Vector3): void {
  const current = getExploration();
  const nearby = LANDMARKS.find(
    (place) =>
      Math.hypot(position.x - place.x, position.z - place.z) < place.radius &&
      Math.abs(position.y - terrainHeightAt(place.x, place.z)) < LANDMARK_HEIGHT_RANGE,
  );
  if ((nearby?.name ?? '') !== current.nearby) updateExploration({ nearby: nearby?.name ?? '' });
  const isNewDiscovery = nearby && !current.discovered.includes(nearby.id);
  if (isNewDiscovery) {
    updateExploration({
      discovered: [...current.discovered, nearby.id],
      notice: `${nearby.name} 발견 · ${nearby.description}`,
    });
    saveExploration();
  }
}

function finishRun(tracker: ExplorationTracker, current: Snapshot): void {
  const result = Math.max(MIN_RESULT, roundTenth(tracker.elapsed));
  updateExploration({
    active: false,
    nextGate: centers.length,
    elapsed: result,
    best: Math.min(current.best ?? Infinity, result),
    notice: `바람길 완주 · ${result.toFixed(1)}초`,
  });
  saveExploration();
}

function advanceGate(tracker: ExplorationTracker, position: Vector3, current: Snapshot): void {
  const center = centers[current.nextGate];
  if (!center) return;
  if (!crossesGate(tracker.previous, position, center)) return;
  if (current.nextGate === centers.length - 1) {
    finishRun(tracker, current);
    return;
  }
  updateExploration({
    active: true,
    nextGate: current.nextGate + 1,
    notice: current.nextGate === 0 ? '바람길 시작 · 빛나는 고리를 따라가세요' : '',
  });
}

function syncTimer(tracker: ExplorationTracker): void {
  const current = getExploration();
  const hasTickedTenth = current.active && floorTenth(tracker.elapsed) !== current.elapsed;
  if (hasTickedTenth) updateExploration({ elapsed: floorTenth(tracker.elapsed) });
}

function expireNotice(tracker: ExplorationTracker, clock: number): void {
  const current = getExploration();
  if (current.notice !== tracker.lastNotice) {
    tracker.lastNotice = current.notice;
    tracker.noticeUntil = clock + NOTICE_SECONDS;
  }
  const shouldClearNotice = current.notice && clock > tracker.noticeUntil;
  if (shouldClearNotice) updateExploration({ notice: '' });
}

export function stepExploration(tracker: ExplorationTracker, clock: number, delta: number): void {
  const position = tracker.body.copy(runnerState.position);
  position.y += TORSO_HEIGHT;
  if (!tracker.isInitialized) {
    tracker.previous.copy(position);
    tracker.isInitialized = true;
  }
  recordNearby(position);
  const current = getExploration();
  if (!current.active) tracker.elapsed = 0;
  else tracker.elapsed += Math.min(delta, MAX_TIMER_DELTA);
  advanceGate(tracker, position, current);
  syncTimer(tracker);
  expireNotice(tracker, clock);
  tracker.previous.copy(position);
}
