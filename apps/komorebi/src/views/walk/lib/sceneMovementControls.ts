import { startJump } from '@views/walk/lib/motion';
import type { SceneContext, WalkEngine } from '@views/walk/lib/sceneContext';
import type { SceneTravel } from '@views/walk/lib/sceneTravel';
import { START_REGION } from '@views/walk/lib/walkState';
import { SPAWN } from '@views/walk/model/world/world';

const ACTION_LOCK_MS = 2_200;

export function createMovementControls(
  { state, wake, parts }: SceneContext,
  { plan, redirect, switchRegion }: SceneTravel,
): Pick<WalkEngine, 'setPaused' | 'setInput' | 'playAction' | 'travelTo' | 'reset'> {
  const { placeEffects, jump, keys, portalInput, startPlate } = parts;
  const jumpOnPress = (pressed: boolean) => {
    if (pressed && !state.paused) startJump(jump);
  };
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
        jumpOnPress(pressed);
        return;
      }
      if (pressed && state.paused) return;
      if (!pressed) {
        keys.delete(key);
        return;
      }
      keys.add(key);
      state.route = [];
      state.destination = null;
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
