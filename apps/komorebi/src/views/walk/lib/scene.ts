import { createChalkLayer } from '@views/walk/lib/chalkLayer';
import { nearbyRegions } from '@views/walk/lib/regionPlates';
import { renderPixelRatio } from '@views/walk/lib/renderBudget';
import type { SceneContext, SceneOptions, WalkEngine } from '@views/walk/lib/sceneContext';
import { createWalkControls } from '@views/walk/lib/sceneControls';
import { bindSceneInput } from '@views/walk/lib/sceneInput';
import { createSceneLoop } from '@views/walk/lib/sceneLoop';
import { createPlayerMotion } from '@views/walk/lib/scenePlayer';
import { createSceneParts } from '@views/walk/lib/sceneSetup';
import { createStatusReporter } from '@views/walk/lib/sceneStatus';
import { createSceneTravel } from '@views/walk/lib/sceneTravel';
import { createWorldMotion } from '@views/walk/lib/sceneWorld';
import { START_REGION, createWalkState } from '@views/walk/lib/walkState';
import { companionStore } from '@views/walk/model/store/companions';
import { DEFAULT_APPEARANCE } from '@views/walk/model/world/appearance';

export type { SceneOptions, WalkEngine } from '@views/walk/lib/sceneContext';
export type { SceneStatus } from '@views/walk/lib/sceneStatus';

export async function createScene(container: HTMLElement, options: SceneOptions): Promise<WalkEngine> {
  const { appearance = DEFAULT_APPEARANCE } = options;
  const parts = await createSceneParts(container, options);
  const { plates, renderer, touchDevice, camera, background, placeEffects } = parts;
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
  container.dataset.region = state.region;
  container.dataset.appearance = `${state.currentAppearance.character}-${state.currentAppearance.outfit}`;
  const listening = new AbortController();
  const listen = { signal: listening.signal };
  motionQuery.addEventListener('change', motionPreference, listen);
  const tick = createSceneLoop(ctx, {
    player: createPlayerMotion(ctx),
    world: createWorldMotion(ctx),
    reportStatus: createStatusReporter(ctx),
    arriveAt: travel.arriveAt,
  });
  bindSceneInput(ctx, travel, tick, listen);
  state.animation = requestAnimationFrame(tick);
  plates.focus(nearbyRegions(START_REGION));
  return createWalkControls(ctx, travel, { observer, listening, unsubscribeCompanions, chalkLayer });
}
