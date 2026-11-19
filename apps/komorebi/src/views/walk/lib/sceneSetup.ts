import * as THREE from 'three';
import { DEFAULT_APPEARANCE, characterLayers } from '../model/world/appearance';
import { createSlideMotion } from '../model/world/world';
import { createBallScene } from './ballScene';
import { createBedRest } from './bedRest';
import { createBoats } from './boats';
import { createChild } from './child';
import { createCompanionScene } from './companionScene';
import { createCountryside } from './countryside';
import { createDriftingLeaves } from './driftingLeaves';
import { createDust } from './dust';
import { createFireflies } from './fireflies';
import { createJump } from './motion';
import { createNightLights } from './nightLights';
import { createPierFishing } from './pierFishing';
import { createPlaceEffects } from './placeEffects';
import { createPortalInput } from './portalInput';
import { createPortals } from './portals';
import { createRain } from './rain';
import { createRegionPlates, preparePaintingTexture } from './regionPlates';
import { createRoamers } from './roamers';
import type { SceneOptions } from './sceneContext';
import { createSceneLife } from './sceneLife';
import {
  createBackgroundMaterial,
  createDestinationMarkers,
  createForegroundMaterial,
  createForegrounds,
  createMarkerTexture,
  createShadow,
  createTargetMarker,
} from './sceneSprites';
import { createSchoolmates } from './schoolmatesScene';
import { START_REGION } from './walkState';
import { createWaterMaps } from './water';
import { createWaves } from './waves';

export const CHILD_ORDER = 4;

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
  const outfits = new Map<string, THREE.Texture>([[layerUrls.outfit, outfitAtlas.value]]);
  let character: ReturnType<typeof createChild>;
  try {
    character = createChild({
      body: bodyAtlas.value,
      outfit: outfitAtlas.value,
      bodyPoseOffsets: layerUrls.bodyPoseOffsets,
    });
  } catch (error) {
    releaseTextures();
    throw error;
  }
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
  const scene = new THREE.Scene();
  // Every layer shares the painted map coordinates; depth must not shift feet off the path.
  const camera = new THREE.OrthographicCamera(-60, 60, 40, -40, 0.1, 200);
  camera.position.set(0, 0, 100);
  const geo = new THREE.PlaneGeometry(120, 80, 1, 1);
  const waterMaps = createWaterMaps(loader);
  const background = createBackgroundMaterial(startPlate.value, START_REGION, waterMaps);
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
    startPlate: startPlate.value,
  };
}
