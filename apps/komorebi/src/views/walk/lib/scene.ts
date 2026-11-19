import { MS_PER_SECOND } from '../config/time';
import { BALL_PHASE, BALL_TIMING } from '../model/ballGame';
import { companionStore } from '../model/store/companions';
import { DEFAULT_APPEARANCE } from '../model/world/appearance';
import { isIndoors } from '../model/world/world';
import { catchCelebration } from './catchCelebration';
import { createChalkLayer } from './chalkLayer';
import { FISHING_PHASE } from './fishing';
import { advanceJump, isAirborne } from './motion';
import { nearbyRegions } from './regionPlates';
import { RENDER_RATE, nextRenderTime, renderPixelRatio, shouldRenderFrame } from './renderBudget';
import type { SceneContext, SceneOptions, WalkEngine } from './sceneContext';
import { createWalkControls } from './sceneControls';
import { MOVE_KEYS, bindSceneInput } from './sceneInput';
import { createPlayerMotion } from './scenePlayer';
import { createSceneParts } from './sceneSetup';
import { createStatusReporter } from './sceneStatus';
import { createSceneTravel } from './sceneTravel';
import { createWorldMotion } from './sceneWorld';
import { START_REGION, createWalkState } from './walkState';

export type { SceneOptions, WalkEngine } from './sceneContext';
export type { SceneStatus } from './sceneStatus';

export async function createScene(container: HTMLElement, options: SceneOptions): Promise<WalkEngine> {
  const { appearance = DEFAULT_APPEARANCE } = options;
  const parts = await createSceneParts(container, options);
  const {
    plates,
    renderer,
    touchDevice,
    scene,
    camera,
    background,
    child,
    pierFishing,
    companions,
    placeEffects,
    schoolmates,
    ball,
    dust,
    jump,
    keys,
  } = parts;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = createWalkState(appearance, motionQuery.matches);
  const wake = () => {
    state.isSettling = true;
    state.nextFrame = 0;
  };
  const unsubscribeCompanions = companionStore.subscribe(wake);
  const chalkLayer = createChalkLayer(wake);
  background.uniforms.chalk!.value = chalkLayer.texture;
  const motionPreference = (event: MediaQueryListEvent) => {
    state.reducedMotion = event.matches;
    if (state.reducedMotion) placeEffects.clear();
    wake();
  };
  const resize = () => {
    const w = Math.max(container.clientWidth, 1),
      h = Math.max(container.clientHeight, 1),
      aspect = w / h;
    const fullHeight = Math.min(80, 120 / aspect);
    state.halfHeight = fullHeight * 0.47;
    state.halfWidth = state.halfHeight * aspect;
    camera.left = -state.halfWidth;
    camera.right = state.halfWidth;
    camera.top = state.halfHeight;
    camera.bottom = -state.halfHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(renderPixelRatio(w, h, window.devicePixelRatio, touchDevice));
    background.uniforms.renderDpr!.value = renderer.getPixelRatio();
    renderer.setSize(w, h);
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const ctx: SceneContext = { container, options, state, parts, wake };
  const travel = createSceneTravel(ctx);
  const { arriveAt } = travel;
  container.dataset.region = state.region;
  container.dataset.appearance = `${state.currentAppearance.character}-${state.currentAppearance.outfit}`;
  const listening = new AbortController();
  const listen = { signal: listening.signal };
  bindSceneInput(ctx, travel, tick, listen);
  motionQuery.addEventListener('change', motionPreference, listen);
  const { walk, animateCharacter, placeCharacter, playFootfall, followCamera } = createPlayerMotion(ctx);
  const { placeMarkers, easeAtmosphere, paintBackground, animateLife } = createWorldMotion(ctx);
  const reportStatus = createStatusReporter(ctx);
  function tick(time: number) {
    if (state.disposed || document.hidden) return;
    const wasAirborne = isAirborne(jump);
    const hasMoveKey = MOVE_KEYS.some((key) => keys.has(key));
    const isMoving = !state.paused && (hasMoveKey || state.route.length > 0 || wasAirborne || state.moveSpeed > 0.05);
    const isBallMoving =
      state.ballFrame !== null &&
      state.ballFrame.phase !== BALL_PHASE.complete &&
      !(state.ballFrame.phase === BALL_PHASE.missed && state.ballFrame.elapsed >= BALL_TIMING.miss);
    const rate =
      isMoving || state.isSettling || state.fishingFrame || isBallMoving ? RENDER_RATE.active : RENDER_RATE.idle;
    if (!shouldRenderFrame(time, state.nextFrame, rate)) {
      state.animation = requestAnimationFrame(tick);
      return;
    }
    state.nextFrame = nextRenderTime(time, state.nextFrame, rate);
    const dt = state.last ? Math.min((time - state.last) / MS_PER_SECOND, 0.05) : 0;
    state.last = time;
    state.elapsed += dt;
    state.companionAge += dt;
    if (state.fishingFrame) state.fishingAge += dt;
    state.fishingLift =
      state.fishingFrame?.phase === FISHING_PHASE.caught
        ? catchCelebration(state.fishingAge, state.reducedMotion).childLift
        : 0;
    if ((!state.paused || state.fishingFrame) && !state.reducedMotion) state.sceneryTime += dt;
    background.uniforms.sceneryTime!.value = state.reducedMotion ? 0 : state.sceneryTime;
    if (!state.paused) advanceJump(jump, dt);
    const hasLanded = !state.paused && wasAirborne && !isAirborne(jump);
    const regionBefore = state.region;
    const stride = walk(dt);
    if (!state.paused) arriveAt();
    const { scale, size, rest, hasStepped } = animateCharacter(dt, stride);
    const isFootfall =
      (!state.paused || state.ballFrame?.phase === BALL_PHASE.ready) &&
      state.region === regionBefore &&
      (hasLanded || hasStepped);
    if (isFootfall) playFootfall(hasLanded, scale);
    placeCharacter(scale, size, rest);
    pierFishing.update(state.fishingAge, state.fishingFrame, child.position, size, state.reducedMotion);
    companions.update(
      dt,
      state.elapsed,
      state.region,
      companionStore.get(),
      state.fishingFrame,
      state.fishingAge,
      state.reducedMotion,
    );
    const isCameraMoving = followCamera(dt, size);
    placeMarkers();
    const isAtmosphereChanging = easeAtmosphere(dt);
    paintBackground(dt, size);
    animateLife(state.paused && !state.fishingFrame ? 0 : dt, rest !== null);
    ball.update({
      game: state.ballFrame,
      player: state.position,
      friend: schoolmates.standing.find((friend) => friend.id === state.greetingId) ?? null,
      isStill: state.reducedMotion,
    });
    dust.update({
      dt,
      elapsed: state.elapsed,
      isIndoors: isIndoors(state.region),
      darkness: state.darkness,
      wetness: state.wetness,
      isStill: state.reducedMotion || state.paused,
    });
    state.isSettling =
      isCameraMoving ||
      isAtmosphereChanging ||
      (!state.paused && placeEffects.isPlaying) ||
      state.transition < 1 ||
      (!state.paused && jump.landing > 0.01) ||
      state.sleeping;
    if (state.elapsed - state.statusTime > 0.12) {
      reportStatus(stride, rest);
      state.statusTime = state.elapsed;
    }
    renderer.render(scene, camera);
    state.animation = requestAnimationFrame(tick);
  }
  state.animation = requestAnimationFrame(tick);
  plates.focus(nearbyRegions(START_REGION));
  state.animation = requestAnimationFrame(tick);
  plates.focus(nearbyRegions(START_REGION));
  return createWalkControls(ctx, travel, { observer, listening, unsubscribeCompanions, chalkLayer });
}
