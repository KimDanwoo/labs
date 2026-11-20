import { createBallScene } from '@views/walk/lib/ballScene';
import { createBedRest } from '@views/walk/lib/bedRest';
import { createBoats } from '@views/walk/lib/boats';
import { createChild } from '@views/walk/lib/child';
import { createCompanionScene } from '@views/walk/lib/companionScene';
import { createCountryside } from '@views/walk/lib/countryside';
import { createDriftingLeaves } from '@views/walk/lib/driftingLeaves';
import { createDust } from '@views/walk/lib/dust';
import { createFireflies } from '@views/walk/lib/fireflies';
import { createJump } from '@views/walk/lib/motion';
import { createNightLights } from '@views/walk/lib/nightLights';
import { createPierFishing } from '@views/walk/lib/pierFishing';
import { createPlaceEffects } from '@views/walk/lib/placeEffects';
import { createPortalInput } from '@views/walk/lib/portalInput';
import { createPortals } from '@views/walk/lib/portals';
import { createRain } from '@views/walk/lib/rain';
import { createRegionPlates, preparePaintingTexture } from '@views/walk/lib/regionPlates';
import { createRoamers } from '@views/walk/lib/roamers';
import type { SceneOptions } from '@views/walk/lib/sceneContext';
import { createSceneLife } from '@views/walk/lib/sceneLife';
import {
  createBackgroundMaterial,
  createDestinationMarkers,
  createForegroundMaterial,
  createForegrounds,
  createMarkerTexture,
  createShadow,
  createTargetMarker,
} from '@views/walk/lib/sceneSprites';
import { createSchoolmates } from '@views/walk/lib/schoolmatesScene';
import { START_REGION } from '@views/walk/lib/walkState';
import { createWaterMaps } from '@views/walk/lib/water';
import { createWaves } from '@views/walk/lib/waves';
import { DEFAULT_APPEARANCE, characterLayers } from '@views/walk/model/world/appearance';
import { createSlideMotion } from '@views/walk/model/world/movement';
import * as THREE from 'three';

export const CHILD_ORDER = 4;

interface StartTextureRequest {
  loader: THREE.TextureLoader;
  plates: ReturnType<typeof createRegionPlates>;
  loaded: THREE.Texture[];
  layerUrls: ReturnType<typeof characterLayers>;
  signal: AbortSignal | undefined;
  releaseTextures: () => void;
}

async function loadStartTextures({ loader, plates, loaded, layerUrls, signal, releaseTextures }: StartTextureRequest) {
  const [startPlate, bodyAtlas, outfitAtlas] = await Promise.allSettled([
    plates.ensure(START_REGION),
    loader.loadAsync(layerUrls.body),
    loader.loadAsync(layerUrls.outfit),
  ]);
  for (const atlas of [bodyAtlas, outfitAtlas]) {
    if (atlas.status === 'fulfilled') loaded.push(preparePaintingTexture(atlas.value));
  }
  if (
    startPlate.status === 'rejected' ||
    bodyAtlas.status === 'rejected' ||
    outfitAtlas.status === 'rejected' ||
    signal?.aborted
  ) {
    releaseTextures();
    const failure = [startPlate, bodyAtlas, outfitAtlas].find((result) => result.status === 'rejected');
    throw failure?.reason ?? new DOMException('Scene cancelled', 'AbortError');
  }
  return { startPlate: startPlate.value, bodyAtlas: bodyAtlas.value, outfitAtlas: outfitAtlas.value };
}

function createRenderer(container: HTMLElement, character: { dispose: () => void }, releaseTextures: () => void) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  } catch (error) {
    character.dispose();
    releaseTextures();
    throw error;
  }
  const touchDevice = window.matchMedia('(pointer: coarse)').matches;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor('#1b352b');
  renderer.domElement.setAttribute('aria-label', '햇빛이 비치는 시골길. 길을 클릭하거나 방향키를 눌러 걸어 보세요.');
  container.appendChild(renderer.domElement);
  return { renderer, touchDevice };
}

export async function createSceneParts(
  container: HTMLElement,
  { appearance = DEFAULT_APPEARANCE, signal, onNotice }: SceneOptions,
) {
  const loader = new THREE.TextureLoader();
  const plates = createRegionPlates(loader, [START_REGION]);
  const loaded: THREE.Texture[] = [];
  const releaseTextures = () => {
    plates.dispose();
    loaded.forEach((texture) => texture.dispose());
  };
  const layerUrls = characterLayers(appearance);
  const textures = await loadStartTextures({ loader, plates, loaded, layerUrls, signal, releaseTextures });
  const { startPlate, bodyAtlas, outfitAtlas } = textures;
  const outfits = new Map<string, THREE.Texture>([[layerUrls.outfit, outfitAtlas]]);
  let character: ReturnType<typeof createChild>;
  try {
    character = createChild({
      body: bodyAtlas,
      outfit: outfitAtlas,
      bodyPoseOffsets: layerUrls.bodyPoseOffsets,
    });
  } catch (error) {
    releaseTextures();
    throw error;
  }
  const { renderer, touchDevice } = createRenderer(container, character, releaseTextures);
  const scene = new THREE.Scene();
  // Every layer shares the painted map coordinates; depth must not shift feet off the path.
  const camera = new THREE.OrthographicCamera(-60, 60, 40, -40, 0.1, 200);
  camera.position.set(0, 0, 100);
  const geo = new THREE.PlaneGeometry(120, 80, 1, 1);
  const waterMaps = createWaterMaps(loader);
  const background = createBackgroundMaterial(startPlate, START_REGION, waterMaps);
  scene.add(new THREE.Mesh(geo, background));
  const child = character.group;
  scene.add(child);
  const pierFishing = createPierFishing(scene);
  const companions = createCompanionScene(scene, loader);
  // Group order sorts before mesh order: keep the group at the scene default
  // so the foreground can render after the character's individual sprites.
  child.children.forEach((part) => {
    part.renderOrder = CHILD_ORDER;
  });
  const foregroundMaterial = createForegroundMaterial(background);
  const bedRest = createBedRest(scene, foregroundMaterial);
  const foregrounds = createForegrounds(scene, foregroundMaterial);
  const { sprite: shadow, material: shadowMat, texture: shadowTexture } = createShadow(scene);
  loaded.push(shadowTexture);
  const dust = createDust(scene);
  const markerMap = createMarkerTexture();
  loaded.push(markerMap);
  const { sprites: markers, materials: markerMats } = createDestinationMarkers(scene, markerMap);
  const portalVisuals = createPortals(scene);
  const fireflies = createFireflies(scene);
  const placeEffects = createPlaceEffects(scene);
  const nightLights = createNightLights(scene);
  const life = createSceneLife(scene, loader);
  const roamers = createRoamers(scene, loader);
  const schoolmates = createSchoolmates(scene, loader, onNotice);
  const ball = createBallScene(scene);
  const waves = createWaves(scene, loader);
  const boats = createBoats(scene);
  const countryside = createCountryside(scene);
  const leaves = createDriftingLeaves(scene);
  const rain = createRain(scene);
  const { sprite: targetMarker, material: targetMat } = createTargetMarker(scene, markerMap);

  const jump = createJump();
  const slide = createSlideMotion();
  const keys = new Set<string>();
  const portalInput = createPortalInput();
  return {
    loader,
    plates,
    loaded,
    releaseTextures,
    outfits,
    character,
    renderer,
    touchDevice,
    scene,
    camera,
    geo,
    waterMaps,
    background,
    child,
    pierFishing,
    companions,
    foregroundMaterial,
    bedRest,
    foregrounds,
    shadow,
    shadowMat,
    markers,
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
    targetMarker,
    targetMat,
    dust,
    jump,
    slide,
    keys,
    portalInput,
    startPlate,
  };
}
