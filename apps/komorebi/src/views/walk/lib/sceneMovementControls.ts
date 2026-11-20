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
    const shouldJump = pressed && !state.paused;
    if (shouldJump) startJump(jump);
  };
  return {
    setPaused(value) {
      state.paused = value;
      keys.clear();
      if (value) placeEffects.clear();
      wake();
    },
    setInput(key, pressed) {
      if (!pressed) portalInput.release(key);
      const isBlockedPortalKey = pressed && portalInput.isBlocked(key);
      if (isBlockedPortalKey) return;
      if (key === 'shift') {
        state.touchSprint = pressed;
        return;
      }
      if (key === ' ') {
        jumpOnPress(pressed);
        return;
      }
      const isPausedPress = pressed && state.paused;
      if (isPausedPress) return;
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
