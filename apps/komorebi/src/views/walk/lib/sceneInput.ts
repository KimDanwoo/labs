import { gameKey, hasShortcutModifier, isControlTarget } from '@views/walk/lib/input';
import { startJump } from '@views/walk/lib/motion';
import { createPointerPick } from '@views/walk/lib/pointerPick';
import type { SceneContext } from '@views/walk/lib/sceneContext';
import type { SceneTravel } from '@views/walk/lib/sceneTravel';
import { findRoute } from '@views/walk/model/world/routing';

export const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export function bindSceneInput(
  { state, parts }: SceneContext,
  { redirect }: Pick<SceneTravel, 'redirect'>,
  tick: FrameRequestCallback,
  listen: AddEventListenerOptions,
) {
  const { renderer, camera, markers, portalVisuals, jump, keys, portalInput } = parts;
  const keyDown = (event: KeyboardEvent) => {
    const isIgnoredKey = state.paused || (event.target instanceof HTMLElement && isControlTarget(event.target));
    if (isIgnoredKey) return;
    if (hasShortcutModifier(event)) {
      keys.clear();
      return;
    }
    const key = gameKey(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (portalInput.isBlocked(key)) return;
    const isJumpPress = key === ' ' && !event.repeat;
    if (isJumpPress) startJump(jump);
    keys.add(key);
    if (MOVE_KEYS.includes(key)) {
      state.route = [];
      state.destination = null;
    }
  };
  const keyUp = (event: KeyboardEvent) => {
    if (event.key === 'Meta') keys.clear();
    const key = gameKey(event);
    keys.delete(key);
    portalInput.release(key);
  };
  const clear = () => {
    keys.clear();
    portalInput.clear();
    state.last = 0;
    state.nextFrame = 0;
  };
  const visibility = () => {
    clear();
    cancelAnimationFrame(state.animation);
    const shouldContinue = !document.hidden && !state.disposed;
    if (shouldContinue) state.animation = requestAnimationFrame(tick);
  };
  const pick = createPointerPick({ canvas: renderer.domElement, camera, portals: portalVisuals, markers });
  const hover = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    if (state.paused) return;
    const target = pick(event, state.region);
    let cursor = 'default';
    if (target) cursor = target.interactive ? 'pointer' : 'crosshair';
    renderer.domElement.style.cursor = cursor;
  };
  const click = (event: PointerEvent) => {
    if (state.paused) return;
    if (event.button !== 0) return;
    renderer.domElement.focus({ preventScroll: true });
    const target = pick(event, state.region);
    if (!target) return;
    const { point, portal } = target;
    if (portal) {
      state.destination = null;
      redirect(portal);
      state.route = findRoute(state.position, portal.center, state.region);
      return;
    }
    state.destination = null;
    redirect(null);
    state.route = findRoute(state.position, point, state.region);
  };
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '산책 게임. 방향키 또는 WASD로 이동, Shift로 전력 질주, Space로 점프');
  window.addEventListener('keydown', keyDown, listen);
  window.addEventListener('keyup', keyUp, listen);
  window.addEventListener('blur', clear, listen);
  document.addEventListener('visibilitychange', visibility, listen);
  renderer.domElement.addEventListener('pointerdown', click, listen);
  renderer.domElement.addEventListener('pointermove', hover, listen);
}
