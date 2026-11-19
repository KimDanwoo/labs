import { createActivityControls } from './sceneActivityControls';
import type { SceneContext, WalkEngine } from './sceneContext';
import { type SceneResources, createSceneDispose } from './sceneDispose';
import { createLookControls } from './sceneLookControls';
import { createMovementControls } from './sceneMovementControls';
import type { SceneTravel } from './sceneTravel';

export function createWalkControls(ctx: SceneContext, travel: SceneTravel, resources: SceneResources): WalkEngine {
  return {
    ...createMovementControls(ctx, travel),
    ...createActivityControls(ctx),
    ...createLookControls(ctx),
    ...createSceneDispose(ctx, resources),
  };
}
