import { createBedRest } from '@views/walk/lib/bedRest';
import { constrainCameraAxis } from '@views/walk/lib/cameraBounds';
import { FISHING_PHASE } from '@views/walk/lib/fishing';
import { keyboardDirection } from '@views/walk/lib/input';
import { lampGlowAt } from '@views/walk/lib/nightLights';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import { settle } from '@views/walk/lib/renderBudget';
import type { SceneContext } from '@views/walk/lib/sceneContext';
import type { WalkState } from '@views/walk/lib/walkState';
import { BALL_PHASE, BALL_ROLE } from '@views/walk/model/ballGame';
import { DESTINATIONS } from '@views/walk/model/world/landmarks';
import { movePlayer } from '@views/walk/model/world/movement';
import { surfaceAt } from '@views/walk/model/world/surfaces';
import { HOME_BED } from '@views/walk/model/world/world';
import * as THREE from 'three';

const CAMERA_EPSILON = 0.01;
const LANDING_LOUDNESS = 1.6;
const NEAREST_SCALE = characterScale(100);
const RUN_SPEED = 24;
const SPRINT_SPEED = 36;

export type Stride = { walking: boolean; sprinting: boolean; frameTravel: number };
export type BedRestFrame = NonNullable<ReturnType<ReturnType<typeof createBedRest>['update']>>;

function dropReachedWaypoints(state: WalkState) {
  while (
    state.route.length &&
    Math.hypot(state.route[0]!.x - state.position.x, state.route[0]!.z - state.position.z) < 0.02
  )
    state.route.shift();
}
function clearArrivedDestination(state: WalkState) {
  if (state.destination && DESTINATIONS.find((p) => p.id === state.destination)?.region === state.region)
    state.destination = null;
}
function steerAlongRoute(state: WalkState) {
  dropReachedWaypoints(state);
  const next = state.route[0];
  if (!next) {
    clearArrivedDestination(state);
    return null;
  }
  const routeDistance = Math.hypot(next.x - state.position.x, next.z - state.position.z);
  return {
    dx: (next.x - state.position.x) / routeDistance,
    dz: (next.z - state.position.z) / routeDistance,
    routeDistance,
  };
}
function followCameraFor(
  state: WalkState,
  { camera, child, schoolmates }: SceneContext['parts'],
  dt: number,
  size: number,
) {
  const maxX = Math.max(0, 60 - state.halfWidth),
    maxY = Math.max(0, 40 - state.halfHeight);
  const friend = state.ballFrame ? schoolmates.standing.find((friend) => friend.id === state.greetingId) : null;
  const focusX = friend ? (child.position.x + sceneX(friend.x)) / 2 : child.position.x;
  const cameraX = THREE.MathUtils.clamp(focusX * (state.halfWidth < 35 ? 1 : 0), -maxX, maxX);
  const cameraY = friend
    ? -maxY
    : THREE.MathUtils.clamp(Math.min(0, child.position.y + state.halfHeight - 7), -maxY, maxY);
  const characterHeight = 10.4 * size;
  const characterHalfWidth = 3.9 * size;
  const keepX = (x: number) =>
    constrainCameraAxis(
      x,
      state.halfWidth,
      60,
      child.position.x - characterHalfWidth,
      child.position.x + characterHalfWidth,
    );
  const keepY = (y: number) =>
    constrainCameraAxis(y, state.halfHeight, 40, child.position.y - 1, child.position.y + characterHeight);
  // Damp toward a target that already respects the painting edges, so the camera can actually arrive.
  const targetX = keepX(cameraX);
  const targetY = keepY(cameraY);
  const cameraLag = state.reducedMotion ? 100 : 3;
  camera.position.x = keepX(
    settle(THREE.MathUtils.damp(camera.position.x, targetX, cameraLag, dt), targetX, CAMERA_EPSILON),
  );
  camera.position.y = keepY(
    settle(THREE.MathUtils.damp(camera.position.y, targetY, cameraLag, dt), targetY, CAMERA_EPSILON),
  );
  return camera.position.x !== targetX || camera.position.y !== targetY;
}
export function createPlayerMotion({ container, state, parts, options: { onStep } }: SceneContext) {
  const { character, child, bedRest, shadow, shadowMat, jump, slide, keys } = parts;
  function canPlayerMove() {
    return !state.paused || (state.ballFrame?.phase === BALL_PHASE.ready && state.route.length > 0);
  }
  function isSprinting() {
    return !state.paused && (keys.has('shift') || state.touchSprint);
  }
  function stepPlayer(dx: number, dz: number, dt: number, routeDistance: number, isKeyboard: boolean) {
    const perspective = THREE.MathUtils.clamp((state.position.z - 15) / 70, 0.45, 1);
    const speed = state.moveSpeed * Math.max(perspective, 0.75);
    const step = Math.min(speed * dt, routeDistance);
    const next = movePlayer(state.position, dx * step, dz * step, state.region, isKeyboard ? slide : undefined);
    const moved = Math.hypot(next.x - state.position.x, next.z - state.position.z);
    state.distance += moved;
    const isMoving = moved > 0.0001;
    if (isMoving) state.heading = Math.atan2(next.x - state.position.x, next.z - state.position.z);
    state.position = next;
    if (moved < 0.0001 && state.route.length && dt > 0) {
      state.route = [];
      state.destination = null;
    }
    return { isMoving, frameTravel: moved / Math.max(perspective, 0.45) };
  }
  function walk(dt: number) {
    const canMove = canPlayerMove();
    let { dx, dz } = keyboardDirection(keys);
    const keyboardWalking = Math.hypot(dx, dz) > 0;
    if (!keyboardWalking || !canMove) {
      slide.direction = null;
      slide.input = null;
    }
    let routeDistance = Infinity;
    const steer = canMove && !keyboardWalking ? steerAlongRoute(state) : null;
    if (steer) ({ dx, dz, routeDistance } = steer);
    const sprinting = isSprinting();
    const magnitude = Math.hypot(dx, dz);
    const isWalking = magnitude > 0 && canMove;
    const targetSpeed = sprinting ? SPRINT_SPEED : RUN_SPEED;
    state.moveSpeed = THREE.MathUtils.damp(state.moveSpeed, isWalking ? targetSpeed : 0, 24, dt);
    if (!isWalking) return { walking: isWalking, sprinting, frameTravel: 0 };
    const { isMoving, frameTravel } = stepPlayer(dx / magnitude, dz / magnitude, dt, routeDistance, keyboardWalking);
    return { walking: isMoving, sprinting, frameTravel };
  }
  function fishingHeading() {
    if (state.fishingFrame?.phase === FISHING_PHASE.caught && state.fishingAge > 0.8) return 0;
    return Math.PI / 2;
  }
  function characterTiming(rest: BedRestFrame | null, walking: boolean, frameTravel: number, dt: number) {
    if (rest) return { dt, travel: rest.walking ? dt * 6 : 0 };
    const isFrozen = state.paused && !state.fishingFrame && !walking;
    return { dt: isFrozen ? 0 : dt, travel: jump.height > 0 ? frameTravel * 0.2 : frameTravel };
  }
  function characterHeading(rest: BedRestFrame | null) {
    return state.fishingFrame ? fishingHeading() : (rest?.heading ?? state.heading);
  }
  function animateCharacter(dt: number, { walking, frameTravel }: Stride) {
    const scale = characterScale(state.position.z);
    const size = scale * CHILD_SIZE;
    const rest = state.sleeping
      ? bedRest.update(state.darkness, lampGlowAt(state.region, HOME_BED), state.reducedMotion)
      : null;
    const timing = characterTiming(rest, walking, frameTravel, dt);
    child.scale.setScalar(size);
    character.setOpacity(rest?.opacity ?? 1);
    const { hasStepped } = character.update({
      dt: timing.dt,
      travel: timing.travel,
      heading: characterHeading(rest),
      isWalking: rest?.walking ?? walking,
      isRunning: true,
      isStill: state.reducedMotion,
      jumpHeight: jump.height + state.fishingLift,
      landing: jump.landing,
    });
    character.setFishingPose({ frame: state.fishingFrame, elapsed: state.fishingAge, isStill: state.reducedMotion });
    if (!state.fishingFrame && state.paused && !walking)
      character.setCompanionPose({ age: state.companionAge, isStill: state.reducedMotion });
    character.setBallPose({
      game: walking ? null : state.ballFrame,
      role: BALL_ROLE.player,
      heading: state.heading,
      isStill: state.reducedMotion,
    });
    return { scale, size, rest, hasStepped };
  }
  function placeCharacter(scale: number, size: number, rest: BedRestFrame | null) {
    const visualPosition = rest?.point ?? state.position;
    child.position.set(
      sceneX(visualPosition.x),
      sceneY(visualPosition.z) + jump.height * scale + state.fishingLift * size,
      2,
    );
    shadow.position.set(child.position.x + scale * 0.3, sceneY(visualPosition.z) - 0.08, 1);
    const shadowSize = 1 - Math.min((jump.height + state.fishingLift) * 0.12, 0.3);
    shadow.scale.set(3.8 * size * shadowSize, 1.1 * size * shadowSize, 1);
    shadowMat.opacity = (rest?.opacity ?? 1) * (1 - Math.min(jump.height * 0.22, 0.55));
  }
  function playFootfall(hasLanded: boolean, scale: number) {
    const surface = surfaceAt(state.position, state.region);
    container.dataset.surface = surface;
    onStep(surface, ((hasLanded ? LANDING_LOUDNESS : 1) * scale) / NEAREST_SCALE);
  }
  const followCamera = (dt: number, size: number) => followCameraFor(state, parts, dt, size);
  return { walk, animateCharacter, placeCharacter, playFootfall, followCamera };
}
