import { SCENE_LOOP } from '@views/walk/config/sceneLoop';
import { MS_PER_SECOND } from '@views/walk/config/time';
import { catchCelebration } from '@views/walk/lib/catchCelebration';
import { FISHING_PHASE } from '@views/walk/lib/fishing';
import { advanceJump, isAirborne } from '@views/walk/lib/motion';
import { RENDER_RATE, nextRenderTime, shouldRenderFrame } from '@views/walk/lib/renderBudget';
import type { SceneContext } from '@views/walk/lib/sceneContext';
import { MOVE_KEYS } from '@views/walk/lib/sceneInput';
import type { createPlayerMotion } from '@views/walk/lib/scenePlayer';
import type { createStatusReporter } from '@views/walk/lib/sceneStatus';
import type { createWorldMotion } from '@views/walk/lib/sceneWorld';
import { BALL_PHASE, BALL_TIMING } from '@views/walk/model/ballGame';
import { companionStore } from '@views/walk/model/store/companions';
import { isIndoors } from '@views/walk/model/world/world';

type WalkState = SceneContext['state'];
type PlayerMotion = ReturnType<typeof createPlayerMotion>;
type Pose = ReturnType<PlayerMotion['animateCharacter']>;

interface SceneLoopSteps {
  player: PlayerMotion;
  world: ReturnType<typeof createWorldMotion>;
  reportStatus: ReturnType<typeof createStatusReporter>;
  arriveAt: () => void;
}

interface ChildFrame {
  stride: ReturnType<PlayerMotion['walk']>;
  size: Pose['size'];
  rest: Pose['rest'];
}

function isBallInPlay({ ballFrame }: WalkState) {
  if (ballFrame === null) return false;
  if (ballFrame.phase === BALL_PHASE.complete) return false;
  return !(ballFrame.phase === BALL_PHASE.missed && ballFrame.elapsed >= BALL_TIMING.miss);
}

function isChildMoving(state: WalkState, hasMoveKey: boolean, wasAirborne: boolean) {
  if (state.paused) return false;
  return hasMoveKey || state.route.length > 0 || wasAirborne || state.moveSpeed > SCENE_LOOP.movingSpeed;
}

function frameRate({ state, parts }: SceneContext, wasAirborne: boolean) {
  const hasMoveKey = MOVE_KEYS.some((key) => parts.keys.has(key));
  const isActive =
    isChildMoving(state, hasMoveKey, wasAirborne) ||
    state.isSettling ||
    Boolean(state.fishingFrame) ||
    isBallInPlay(state);
  return isActive ? RENDER_RATE.active : RENDER_RATE.idle;
}

function advanceFishingClock(state: WalkState, dt: number) {
  if (state.fishingFrame) state.fishingAge += dt;
  const isCaught = state.fishingFrame?.phase === FISHING_PHASE.caught;
  state.fishingLift = isCaught ? catchCelebration(state.fishingAge, state.reducedMotion).childLift : 0;
}

function advanceClocks({ state, parts }: SceneContext, time: number) {
  const dt = state.last ? Math.min((time - state.last) / MS_PER_SECOND, SCENE_LOOP.maxFrameDelta) : 0;
  state.last = time;
  state.elapsed += dt;
  state.companionAge += dt;
  advanceFishingClock(state, dt);
  const isSceneryRunning = (!state.paused || Boolean(state.fishingFrame)) && !state.reducedMotion;
  if (isSceneryRunning) state.sceneryTime += dt;
  parts.background.uniforms.sceneryTime!.value = state.reducedMotion ? 0 : state.sceneryTime;
  return dt;
}

function isFootfall(state: WalkState, regionBefore: WalkState['region'], hasLanded: boolean, hasStepped: boolean) {
  const canStep = !state.paused || state.ballFrame?.phase === BALL_PHASE.ready;
  return canStep && state.region === regionBefore && (hasLanded || hasStepped);
}

function moveChild(
  { state, parts }: SceneContext,
  steps: SceneLoopSteps,
  dt: number,
  wasAirborne: boolean,
): ChildFrame {
  const { player } = steps;
  if (!state.paused) advanceJump(parts.jump, dt);
  const hasLanded = !state.paused && wasAirborne && !isAirborne(parts.jump);
  const regionBefore = state.region;
  const stride = player.walk(dt);
  if (!state.paused) steps.arriveAt();
  const { scale, size, rest, hasStepped } = player.animateCharacter(dt, stride);
  if (isFootfall(state, regionBefore, hasLanded, hasStepped)) player.playFootfall(hasLanded, scale);
  player.placeCharacter(scale, size, rest);
  return { stride, size, rest };
}

function updateCompanions({ state, parts }: SceneContext, dt: number, size: ChildFrame['size']) {
  parts.pierFishing.update(state.fishingAge, state.fishingFrame, parts.child.position, size, state.reducedMotion);
  parts.companions.update(
    dt,
    state.elapsed,
    state.region,
    companionStore.get(),
    state.fishingFrame,
    state.fishingAge,
    state.reducedMotion,
  );
}

function updateWorld({ state }: SceneContext, steps: SceneLoopSteps, dt: number, frame: ChildFrame) {
  const isCameraMoving = steps.player.followCamera(dt, frame.size);
  steps.world.placeMarkers();
  const isAtmosphereChanging = steps.world.easeAtmosphere(dt);
  steps.world.paintBackground(dt, frame.size);
  const isLifeStill = state.paused && !state.fishingFrame;
  steps.world.animateLife(isLifeStill ? 0 : dt, frame.rest !== null);
  return isCameraMoving || isAtmosphereChanging;
}

function updateProps({ state, parts }: SceneContext, dt: number) {
  parts.ball.update({
    game: state.ballFrame,
    player: state.position,
    friend: parts.schoolmates.standing.find((friend) => friend.id === state.greetingId) ?? null,
    isStill: state.reducedMotion,
  });
  parts.dust.update({
    dt,
    elapsed: state.elapsed,
    isIndoors: isIndoors(state.region),
    darkness: state.darkness,
    wetness: state.wetness,
    isStill: state.reducedMotion || state.paused,
  });
}

function isSceneSettling({ state, parts }: SceneContext, isViewChanging: boolean) {
  const isEffectRunning =
    !state.paused && (parts.placeEffects.isPlaying || parts.jump.landing > SCENE_LOOP.landingSettle);
  return isViewChanging || isEffectRunning || state.transition < 1 || state.sleeping;
}

function reportIfDue({ state }: SceneContext, steps: SceneLoopSteps, frame: ChildFrame) {
  if (state.elapsed - state.statusTime <= SCENE_LOOP.statusInterval) return;
  steps.reportStatus(frame.stride, frame.rest);
  state.statusTime = state.elapsed;
}

export function createSceneLoop(ctx: SceneContext, steps: SceneLoopSteps): FrameRequestCallback {
  const { state, parts } = ctx;
  function tick(time: number) {
    if (state.disposed) return;
    if (document.hidden) return;
    const wasAirborne = isAirborne(parts.jump);
    const rate = frameRate(ctx, wasAirborne);
    if (!shouldRenderFrame(time, state.nextFrame, rate)) {
      state.animation = requestAnimationFrame(tick);
      return;
    }
    state.nextFrame = nextRenderTime(time, state.nextFrame, rate);
    const dt = advanceClocks(ctx, time);
    const frame = moveChild(ctx, steps, dt, wasAirborne);
    updateCompanions(ctx, dt, frame.size);
    const isViewChanging = updateWorld(ctx, steps, dt, frame);
    updateProps(ctx, dt);
    state.isSettling = isSceneSettling(ctx, isViewChanging);
    reportIfDue(ctx, steps, frame);
    parts.renderer.render(parts.scene, parts.camera);
    state.animation = requestAnimationFrame(tick);
  }
  return tick;
}
