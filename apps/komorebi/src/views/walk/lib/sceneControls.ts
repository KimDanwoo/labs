import { createActivityControls } from '@views/walk/lib/sceneActivityControls';
import type { SceneContext, WalkEngine } from '@views/walk/lib/sceneContext';
import { type SceneResources, createSceneDispose } from '@views/walk/lib/sceneDispose';
import { createLookControls } from '@views/walk/lib/sceneLookControls';
import { createMovementControls } from '@views/walk/lib/sceneMovementControls';
import type { SceneTravel } from '@views/walk/lib/sceneTravel';

export function createWalkControls(ctx: SceneContext, travel: SceneTravel, resources: SceneResources): WalkEngine {
  return {
    ...createMovementControls(ctx, travel),
    ...createActivityControls(ctx),
    ...createLookControls(ctx),
    ...createSceneDispose(ctx, resources),
  };
}
