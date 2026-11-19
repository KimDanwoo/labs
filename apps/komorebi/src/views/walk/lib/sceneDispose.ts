import type { createChalkLayer } from './chalkLayer';
import type { SceneContext, WalkEngine } from './sceneContext';

export interface SceneResources {
  observer: ResizeObserver;
  listening: AbortController;
  unsubscribeCompanions: () => void;
  chalkLayer: ReturnType<typeof createChalkLayer>;
}

export function createSceneDispose(
  { state, parts }: SceneContext,
  { observer, listening, unsubscribeCompanions, chalkLayer }: SceneResources,
): Pick<WalkEngine, 'dispose'> {
  const {
    releaseTextures,
    character,
    renderer,
    geo,
    waterMaps,
    background,
    pierFishing,
    companions,
    foregroundMaterial,
    bedRest,
    foregrounds,
    shadowMat,
    markerMats,
    portalVisuals,
    fireflies,
    placeEffects,
    nightLights,
    life,
    roamers,
    schoolmates,
    ball,
    waves,
    boats,
    countryside,
    leaves,
    rain,
    targetMat,
    dust,
  } = parts;
  return {
    dispose() {
      if (state.disposed) return;
      state.disposed = true;
      cancelAnimationFrame(state.animation);
      observer.disconnect();
      listening.abort();
      foregrounds.forEach(({ mesh }) => mesh.geometry.dispose());
      foregroundMaterial.dispose();
      bedRest.dispose();
      pierFishing.dispose();
      companions.dispose();
      unsubscribeCompanions();
      portalVisuals.dispose();
      fireflies.dispose();
      placeEffects.dispose();
      chalkLayer.dispose();
      nightLights.dispose();
      life.dispose();
      roamers.dispose();
      schoolmates.dispose();
      ball.dispose();
      waves.dispose();
      boats.dispose();
      countryside.dispose();
      leaves.dispose();
      waterMaps.dispose();
      rain.dispose();
      geo.dispose();
      dust.dispose();
      [background, shadowMat, targetMat, ...markerMats].forEach((m) => m.dispose());
      releaseTextures();
      character.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
