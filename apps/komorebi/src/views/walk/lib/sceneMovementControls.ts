import { SPAWN } from '../model/world/world';
import { startJump } from './motion';
import type { SceneContext, WalkEngine } from './sceneContext';
import type { SceneTravel } from './sceneTravel';
import { START_REGION } from './walkState';

const ACTION_LOCK_MS = 2_200;

export function createMovementControls(
  { state, wake, parts }: SceneContext,
  { plan, redirect, switchRegion }: SceneTravel,
): Pick<WalkEngine, 'setPaused' | 'setInput' | 'playAction' | 'travelTo' | 'reset'> {
  const { placeEffects, jump, keys, portalInput, startPlate } = parts;
  return {
    setPaused(value) {
      state.paused = value;
      keys.clear();
      // A dialog covers the scenery, so a half-played action is dropped rather than frozen under it.
      if (value) placeEffects.clear();
      wake();
    },
    setInput(key, pressed) {
      if (!pressed) portalInput.release(key);
      if (pressed && portalInput.isBlocked(key)) return;
      if (key === 'shift') {
        state.touchSprint = pressed;
        return;
      }
      if (key === ' ') {
        if (pressed && !state.paused) startJump(jump);
        return;
      }
      if (pressed && state.paused) return;
      if (pressed) {
        keys.add(key);
        if (key !== 'shift') {
          state.route = [];
          state.destination = null;
        }
      } else keys.delete(key);
    },
    playAction(kind, at) {
      const now = performance.now();
      if (now < state.actionEndsAt) return false;
      state.actionEndsAt = now + ACTION_LOCK_MS;
      if (!state.reducedMotion) placeEffects.play(kind, at);
      wake();
      return true;
    },
    travelTo(id) {
      state.destination = id;
      redirect(plan());
    },
    reset() {
      state.destination = null;
      switchRegion(START_REGION, SPAWN, startPlate);
      keys.clear();
    },
  };
}
