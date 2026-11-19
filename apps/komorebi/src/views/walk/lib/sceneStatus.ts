import { type SchoolmateId } from '../model/schoolmateRoster';
import { nearestSchoolmate } from '../model/schoolmates';
import { closestLandmark, type Landmark } from '../model/world/landmarks';
import { type Point, type Region } from '../model/world/world';
import { type SceneContext } from './sceneContext';
import { type BedRestFrame, type Stride } from './scenePlayer';

export type SceneStatus = Point & {
  region: Region;
  walking: boolean;
  nearby: Landmark | null;
  steps: number;
  schoolmateId: SchoolmateId | null;
};

export function motionLabel(isAirborne: boolean, isMoving: boolean, isSprinting: boolean) {
  if (isAirborne) return 'jumping';
  if (!isMoving) return 'idle';
  return isSprinting ? 'sprinting' : 'running';
}

const STATUS_KEYS = [
  'x',
  'z',
  'region',
  'walking',
  'nearby',
  'steps',
  'schoolmateId',
] as const satisfies (keyof SceneStatus)[];
export const hasStatusChanged = (previous: SceneStatus, next: SceneStatus) =>
  STATUS_KEYS.some((key) => previous[key] !== next[key]);

export function createStatusReporter({ container, state, parts, options: { onStatus } }: SceneContext) {
  const { schoolmates, jump } = parts;
  function reportStatus({ walking, sprinting }: Stride, rest: BedRestFrame | null) {
    container.dataset.position = `${state.position.x.toFixed(2)},${state.position.z.toFixed(2)}`;
    const ballFriend = state.ballFrame ? schoolmates.standing.find((friend) => friend.id === state.greetingId) : null;
    container.dataset.ballDistance = ballFriend
      ? Math.hypot(ballFriend.x - state.position.x, ballFriend.z - state.position.z).toFixed(2)
      : '';
    container.dataset.schoolmatePositions = schoolmates.standing
      .map(({ x, z }) => `${x.toFixed(2)},${z.toFixed(2)}`)
      .join(' ');
    container.dataset.motion = state.sleeping ? 'sleeping' : motionLabel(jump.height > 0, walking, sprinting);
    let restLabel = state.sleeping ? 'settling' : '';
    if (rest && rest.tucked > 0.99) restLabel = 'tucked';
    container.dataset.rest = restLabel;
    const nextStatus: SceneStatus = {
      ...state.position,
      region: state.region,
      walking,
      nearby: closestLandmark(state.position.x, state.position.z, state.region),
      steps: Math.floor(state.distance * 5),
      schoolmateId: nearestSchoolmate(schoolmates.standing, state.position),
    };
    if (state.previousStatus && !hasStatusChanged(state.previousStatus, nextStatus)) return;
    state.previousStatus = nextStatus;
    onStatus(nextStatus);
  }
  return reportStatus;
}
