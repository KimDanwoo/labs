import { TIME, WEATHER, type TimeOfDay, type Weather } from '@features/walk/model/constants';
import { DEFAULT_APPEARANCE, characterAtlas, type Appearance } from '@shared/world/appearance';
import { FOREGROUNDS, foregroundOrder } from '@shared/world/foreground';
import { isAtHomeBed, isNearHomeBed } from '@shared/world/interactions';
import { getWorldPortals, isInsidePortal, portalAt, type WorldPortal } from '@shared/world/portals';
import { surfaceAt, type Surface } from '@shared/world/surfaces';
import {
  DESTINATIONS,
  HOME_BED,
  SPAWN,
  WORLDS,
  closestLandmark,
  createSlideMotion,
  findRoute,
  movePlayer,
  nextRegionStep,
  type Landmark,
  type PlaceAction,
  type Point,
  type Region,
} from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { BACKGROUND_FRAGMENT, BACKGROUND_VERTEX } from './backgroundShader';
import { createBedRest } from './bedRest';
import { createBoats } from './boats';
import { SCENERY_STYLE } from './breeze';
import { constrainCameraAxis } from './cameraBounds';
import { createChild } from './child';
import { createCountryside } from './countryside';
import { createDriftingLeaves } from './driftingLeaves';
import { createFireflies } from './fireflies';
import { gameKey, isControlTarget, keyboardDirection } from './input';
import { advanceJump, createJump, isAirborne, startJump } from './motion';
import { createNightLights, lampGlowAt, lampUniforms } from './nightLights';
import { CHILD_SIZE, characterScale } from './perspective';
import { createPlaceEffects } from './placeEffects';
import { createPointerPick } from './pointerPick';
import { createPortals } from './portals';
import { createRain } from './rain';
import { createRegionPlates, nearbyRegions, preparePaintingTexture } from './regionPlates';
import { RENDER_RATE, nextRenderTime, renderPixelRatio, settle, shouldRenderFrame } from './renderBudget';
import { createRoamers } from './roamers';
import { createSceneLife } from './sceneLife';
import { createWaterMaps } from './water';
import { createWaves } from './waves';

const START_REGION: Region = 'village';
const SEA_REGION: Region = 'coast';
const CAMERA_EPSILON = 0.01;
const WARMTH_EPSILON = 0.002;
const CHILD_ORDER = 4;
/** How much dusk colour each time of day keeps; night adds its own blue on top. */
const WARMTH_BY_TIME = { day: 0, evening: 1, night: 0.35 } satisfies Record<TimeOfDay, number>;
const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
const LANDING_LOUDNESS = 1.6;
const NEAREST_SCALE = characterScale(100);
/** One place action at a time, sound included; the longest cue (the shrine bell) rings about this long. */
const ACTION_LOCK_MS = 2_200;
const RUN_SPEED = 24;
const SPRINT_SPEED = 36;

function motionLabel(isAirborne: boolean, isMoving: boolean, isSprinting: boolean) {
  if (isAirborne) return 'jumping';
  if (!isMoving) return 'idle';
  return isSprinting ? 'sprinting' : 'running';
}

export type SceneStatus = Point & {
  region: Region;
  walking: boolean;
  nearby: Landmark | null;
  steps: number;
};
export type SceneOptions = {
  onStatus: (status: SceneStatus) => void;
  /** Short messages for the player, such as a neighbouring painting still loading. */
  onNotice: (message: string) => void;
  /** A foot touching the ground; loudness already accounts for distance and landings. */
  onStep: (surface: Surface, loudness: number) => void;
  onSleep: () => void;
  appearance?: Appearance;
  signal?: AbortSignal;
};
export type WalkEngine = {
  dispose: () => void;
  /** While paused (a dialog is open) the child stands still and new movement input is ignored. */
  setPaused: (value: boolean) => void;
  finishSleep: () => void;
  setAppearance: (appearance: Appearance) => Promise<boolean>;
  setTimeOfDay: (value: TimeOfDay) => void;
  setWeather: (value: Weather) => void;
  setInput: (key: string, pressed: boolean) => void;
  reset: () => void;
  /** Resolves false when the browser could not encode the picture. */
  photo: () => Promise<boolean>;
  travelTo: (id: string) => void;
  /** Plays a place's little action; false while an earlier one is still playing. */
  playAction: (kind: PlaceAction, at: Point) => boolean;
};

/** Painted scenery on depth-separated Three.js planes, with a hand-inked directional child and a connected walkable lane graph. */
export async function createScene(
  container: HTMLElement,
  { onStatus, onNotice, onStep, onSleep, appearance = DEFAULT_APPEARANCE, signal }: SceneOptions,
): Promise<WalkEngine> {
  const loader = new THREE.TextureLoader();
  const plates = createRegionPlates(loader, [START_REGION]);
  const loaded: THREE.Texture[] = [];
  const releaseTextures = () => {
    plates.dispose();
    loaded.forEach((texture) => texture.dispose());
  };
  // Only the first view blocks the start; the other paintings follow in the background.
  const [startPlate, atlas] = await Promise.allSettled([
    plates.ensure(START_REGION),
    loader.loadAsync(characterAtlas(appearance)),
  ]);
  if (atlas.status === 'fulfilled') loaded.push(preparePaintingTexture(atlas.value));
  if (startPlate.status === 'rejected' || atlas.status === 'rejected' || signal?.aborted) {
    releaseTextures();
    const failure = [startPlate, atlas].find((result) => result.status === 'rejected');
    throw failure?.reason ?? new DOMException('Scene cancelled', 'AbortError');
  }
  const childAtlas = atlas.value;
  const appearances = new Map<string, THREE.Texture>([[characterAtlas(appearance), childAtlas]]);
  let currentAppearance = appearance;
  let appearanceRequest = 0;
  let character: ReturnType<typeof createChild>;
  try {
    character = createChild(childAtlas);
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
  // Cap fill rate on touch devices without changing the CSS viewport.
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
  const background = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: startPlate.value },
      time: { value: 0 },
      evening: { value: 0 },
      night: { value: 0 },
      rain: { value: 0 },
      lamps: { value: lampUniforms(START_REGION).values },
      lampCount: { value: lampUniforms(START_REGION).count },
      walker: { value: new THREE.Vector2(0.5, 0.2) },
      waterMap: { value: waterMaps.of(START_REGION) },
      foam: waterMaps.foam,
      glitter: waterMaps.glitter,
      isSea: { value: 0 },
      isVillage: { value: 1 },
      isHome: { value: 0 },
      outdoorRain: { value: 0 },
      sceneryStyle: { value: SCENERY_STYLE[START_REGION] },
      sceneryTime: { value: 0 },
      renderDpr: { value: 1 },
      fade: { value: 1 },
    },
    vertexShader: BACKGROUND_VERTEX,
    fragmentShader: BACKGROUND_FRAGMENT,
  });
  scene.add(new THREE.Mesh(geo, background));
  const child = character.group;
  scene.add(child);
  // Group order sorts before mesh order: keep the group at the scene default
  // so the foreground can render after the character's individual sprites.
  child.children.forEach((part) => {
    part.renderOrder = CHILD_ORDER;
  });
  // Reuse the painting shader and its live uniforms so lighting and transitions match.
  const foregroundMaterial = background.clone();
  foregroundMaterial.uniforms = background.uniforms;
  foregroundMaterial.transparent = true;
  foregroundMaterial.depthTest = false;
  foregroundMaterial.depthWrite = false;
  const bedRest = createBedRest(scene, foregroundMaterial);
  const foregrounds = FOREGROUNDS.map((layer) => {
    const shape = new THREE.Shape(
      layer.outline.map(([x, y]) => new THREE.Vector2((x / 1536) * 120 - 60, 40 - (y / 1024) * 80)),
    );
    const geometry = new THREE.ShapeGeometry(shape);
    const vertices = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < vertices.count; i++) uv.setXY(i, (vertices.getX(i) + 60) / 120, (vertices.getY(i) + 40) / 80);
    const mesh = new THREE.Mesh(geometry, foregroundMaterial);
    mesh.visible = false;
    scene.add(mesh);
    return { ...layer, mesh };
  });
  const shadowTexture = canvasTexture(128, 64, (c) => {
    const g = c.createRadialGradient(64, 32, 2, 64, 32, 53);
    g.addColorStop(0, '#17332b77');
    g.addColorStop(1, '#17332b00');
    c.fillStyle = g;
    c.scale(1, 0.5);
    c.fillRect(0, 0, 128, 128);
  });
  loaded.push(shadowTexture);
  const shadowMat = new THREE.SpriteMaterial({
    map: shadowTexture,
    transparent: true,
    depthTest: false,
  });
  const shadow = new THREE.Sprite(shadowMat);
  shadow.renderOrder = 3;
  scene.add(shadow);
  // Screen-space flecks float at several actual Z depths, providing gentle parallax.
  const dustGeo = new THREE.BufferGeometry();
  const dust = new Float32Array(45 * 3);
  let seed = 52;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 45; i++) {
    dust[i * 3] = random() * 120 - 60;
    dust[i * 3 + 1] = random() * 70 - 35;
    dust[i * 3 + 2] = 4 + random() * 20;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustMat = new THREE.PointsMaterial({
    color: '#fff6c5',
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });
  const dustCloud = new THREE.Points(dustGeo, dustMat);
  dustCloud.renderOrder = 5;
  scene.add(dustCloud);
  const markerMap = canvasTexture(64, 64, (c) => {
    c.strokeStyle = '#fff8ca';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(32, 9);
    c.lineTo(45, 32);
    c.lineTo(32, 55);
    c.lineTo(19, 32);
    c.closePath();
    c.stroke();
    c.fillStyle = '#ffefaa';
    c.beginPath();
    c.arc(32, 32, 3, 0, Math.PI * 2);
    c.fill();
  });
  loaded.push(markerMap);
  const markerMats = DESTINATIONS.map(
    () => new THREE.SpriteMaterial({ map: markerMap, transparent: true, depthTest: false }),
  );
  const markers = DESTINATIONS.map((p, i) => {
    const s = new THREE.Sprite(markerMats[i]);
    s.position.set(p.x * 1.2 - 60, 40 - p.z * 0.8 + 2, 1);
    s.scale.set(1.7, 1.7, 1);
    s.renderOrder = 2;
    scene.add(s);
    return s;
  });
  const portalVisuals = createPortals(scene);
  const fireflies = createFireflies(scene);
  const placeEffects = createPlaceEffects(scene);
  const nightLights = createNightLights(scene);
  const life = createSceneLife(scene, loader);
  const roamers = createRoamers(scene, loader);
  const waves = createWaves(scene, loader);
  const boats = createBoats(scene);
  const countryside = createCountryside(scene);
  const leaves = createDriftingLeaves(scene);
  let sceneryTime = 0;
  const rain = createRain(scene);
  const targetMat = new THREE.SpriteMaterial({
    map: markerMap,
    color: '#fff9cf',
    transparent: true,
    depthTest: false,
  });
  const targetMarker = new THREE.Sprite(targetMat);
  targetMarker.scale.set(1, 1, 1);
  targetMarker.renderOrder = 2;
  targetMarker.visible = false;
  scene.add(targetMarker);

  let region: Region = START_REGION,
    position = { ...SPAWN },
    route: Point[] = [],
    destination: string | null = null;
  let elapsed = 0,
    last = 0,
    nextFrame = 0,
    statusTime = -1,
    distance = 0,
    animation = 0,
    disposed = false,
    timeOfDay: TimeOfDay = TIME.day,
    darkness = 0,
    weather: Weather = WEATHER.clear,
    wetness = 0,
    paused = false,
    sleeping = false,
    preparingSleep = false,
    sleepBlocked = false,
    isSettling = true,
    warmth = 0,
    transition = 1;
  let blockedPortal: WorldPortal | null = null;
  let waitingPortal: WorldPortal | null = null;
  let actionEndsAt = 0;
  /** An exit the player turned away from while it loaded; choosing it again lifts the block (a failed load does not). */
  let cancelledPortal: WorldPortal | null = null;
  let heading = 0,
    moveSpeed = 0,
    touchSprint = false;
  const jump = createJump();
  const slide = createSlideMotion();
  const keys = new Set<string>();
  /** Render the next frame now and keep the full rate until camera, light and fades come to rest. */
  const wake = () => {
    isSettling = true;
    nextFrame = 0;
  };
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;
  const motionPreference = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
    if (reducedMotion) placeEffects.clear();
    wake();
  };
  let halfWidth = 60,
    halfHeight = 40;
  const resize = () => {
    const w = Math.max(container.clientWidth, 1),
      h = Math.max(container.clientHeight, 1),
      aspect = w / h;
    const fullHeight = Math.min(80, 120 / aspect);
    // A modest crop allows the illustration to drift with the walker.
    halfHeight = fullHeight * 0.47;
    halfWidth = halfHeight * aspect;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(renderPixelRatio(w, h, window.devicePixelRatio, touchDevice));
    background.uniforms.renderDpr!.value = renderer.getPixelRatio();
    renderer.setSize(w, h);
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  /** Routes toward the destination and returns the exit it heads for, if it leaves this region. */
  const plan = (): WorldPortal | null => {
    if (!destination) return null;
    const point = DESTINATIONS.find((p) => p.id === destination);
    if (!point) return null;
    if (point.region === region) {
      route = findRoute(position, point, region);
      return null;
    }
    const portal = getWorldPortals(region).find((p) => p.to === nextRegionStep(region, point.region))!;
    route = findRoute(position, portal.center, region);
    return portal;
  };
  /** A new heading elsewhere cancels the wait at a loading exit until the child steps out of it. */
  const redirect = (exit: WorldPortal | null) => {
    if (exit && exit === cancelledPortal) {
      blockedPortal = null;
      cancelledPortal = null;
      return;
    }
    if (!waitingPortal || waitingPortal === exit) return;
    blockedPortal = waitingPortal;
    cancelledPortal = waitingPortal;
    waitingPortal = null;
  };
  const switchRegion = (next: Region, spawn: Point, plate: THREE.Texture) => {
    jump.height = 0;
    jump.velocity = 0;
    jump.landing = 0;
    region = next;
    if (next === 'home') void bedRest.prepare(currentAppearance.character);
    slide.direction = null;
    slide.input = null;
    position = { ...spawn };
    route = [];
    background.uniforms.map!.value = plate;
    const lamps = lampUniforms(next);
    background.uniforms.lamps!.value = lamps.values;
    background.uniforms.waterMap!.value = waterMaps.of(next);
    background.uniforms.isSea!.value = next === SEA_REGION ? 1 : 0;
    background.uniforms.isVillage!.value = next === 'village' ? 1 : 0;
    background.uniforms.isHome!.value = next === 'home' ? 1 : 0;
    background.uniforms.sceneryStyle!.value = SCENERY_STYLE[next];
    background.uniforms.lampCount!.value = lamps.count;
    // Home stays loaded for the reset button; everything beyond the next exits is freed.
    const nearby = [...new Set([START_REGION, ...nearbyRegions(next)])];
    plates.focus(nearby);
    transition = reducedMotion ? 1 : 0.25;
    blockedPortal = portalAt(position, region);
    waitingPortal = null;
    cancelledPortal = null;
    placeEffects.clear();
    plan();
    wake();
    container.dataset.region = next;
  };
  container.dataset.region = region;
  container.dataset.appearance = `${currentAppearance.character}-${currentAppearance.outfit}`;
  const keyDown = (event: KeyboardEvent) => {
    if (paused || (event.target instanceof HTMLElement && isControlTarget(event.target))) return;
    const key = gameKey(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === ' ' && !event.repeat) startJump(jump);
    keys.add(key);
    if (MOVE_KEYS.includes(key)) {
      route = [];
      destination = null;
    }
  };
  let previousStatus: SceneStatus | undefined;
  const keyUp = (event: KeyboardEvent) => keys.delete(gameKey(event));
  const clear = () => {
    keys.clear();
    last = 0;
    nextFrame = 0;
  };
  const visibility = () => {
    clear();
    cancelAnimationFrame(animation);
    if (!document.hidden && !disposed) animation = requestAnimationFrame(tick);
  };
  const pick = createPointerPick({ canvas: renderer.domElement, camera, portals: portalVisuals, markers });
  const hover = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || paused) return;
    const target = pick(event, region);
    let cursor = 'default';
    if (target) cursor = target.interactive ? 'pointer' : 'crosshair';
    renderer.domElement.style.cursor = cursor;
  };
  const click = (event: PointerEvent) => {
    if (paused || event.button !== 0) return;
    renderer.domElement.focus({ preventScroll: true });
    const target = pick(event, region);
    if (!target) return;
    const { point, portal } = target;
    if (portal) {
      destination = null;
      redirect(portal);
      route = findRoute(position, portal.center, region);
      return;
    }
    destination = null;
    redirect(null);
    route = findRoute(position, point, region);
  };
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '산책 게임. 방향키 또는 WASD로 이동, Shift로 전력 질주, Space로 점프');
  const listening = new AbortController();
  const listen = { signal: listening.signal };
  window.addEventListener('keydown', keyDown, listen);
  window.addEventListener('keyup', keyUp, listen);
  window.addEventListener('blur', clear, listen);
  document.addEventListener('visibilitychange', visibility, listen);
  renderer.domElement.addEventListener('pointerdown', click, listen);
  renderer.domElement.addEventListener('pointermove', hover, listen);
  motionQuery.addEventListener('change', motionPreference, listen);
  const enterPortal = (portal: WorldPortal) => {
    const plate = plates.get(portal.to);
    if (plate) {
      waitingPortal = null;
      switchRegion(portal.to, portal.spawn, plate);
      return;
    }
    if (waitingPortal === portal) return;
    waitingPortal = portal;
    onNotice(`${WORLDS[portal.to].name} 풍경을 펼치고 있어요…`);
    plates.ensure(portal.to).catch(() => {
      if (disposed || waitingPortal !== portal) return;
      waitingPortal = null;
      blockedPortal = portal;
      cancelledPortal = null;
      onNotice('풍경을 불러오지 못했어요. 길을 잠시 벗어났다가 다시 들어가 보세요.');
    });
  };
  async function startSleep() {
    const canSleep = () => !disposed && !paused && region === 'home' && !isAirborne(jump) && isAtHomeBed(position);
    if (preparingSleep || sleepBlocked || !canSleep()) return;
    preparingSleep = true;
    const template = currentAppearance.character;
    const ready = await bedRest.prepare(template);
    preparingSleep = false;
    if (!canSleep() || template !== currentAppearance.character) return;
    sleepBlocked = true;
    if (!ready) {
      onNotice('잠자리를 준비하지 못했어요. 잠시 벗어났다가 다시 와 주세요.');
      return;
    }
    sleeping = true;
    paused = true;
    keys.clear();
    route = [];
    destination = null;
    bedRest.start(position);
    onSleep();
    wake();
  }
  function tick(time: number) {
    if (disposed || document.hidden) return;
    const wasAirborne = isAirborne(jump);
    const hasMoveKey = MOVE_KEYS.some((key) => keys.has(key));
    const isMoving = !paused && (hasMoveKey || route.length > 0 || wasAirborne || moveSpeed > 0.05);
    const rate = isMoving || isSettling ? RENDER_RATE.active : RENDER_RATE.idle;
    if (!shouldRenderFrame(time, nextFrame, rate)) {
      animation = requestAnimationFrame(tick);
      return;
    }
    nextFrame = nextRenderTime(time, nextFrame, rate);
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    elapsed += dt;
    if (!paused && !reducedMotion) sceneryTime += dt;
    background.uniforms.sceneryTime!.value = reducedMotion ? 0 : sceneryTime;
    if (!paused) advanceJump(jump, dt);
    const hasLanded = !paused && wasAirborne && !isAirborne(jump);
    const regionBefore = region;
    let { dx, dz } = keyboardDirection(keys);
    const keyboardWalking = Math.hypot(dx, dz) > 0;
    if (!keyboardWalking || paused) {
      slide.direction = null;
      slide.input = null;
    }
    let routeDistance = Infinity;
    if (!paused && !keyboardWalking) {
      // Reach bends before turning, and consume reached waypoints without pausing a frame.
      while (route.length && Math.hypot(route[0]!.x - position.x, route[0]!.z - position.z) < 0.02) route.shift();
      if (route.length) {
        const next = route[0]!;
        routeDistance = Math.hypot(next.x - position.x, next.z - position.z);
        dx = (next.x - position.x) / routeDistance;
        dz = (next.z - position.z) / routeDistance;
      } else if (destination && DESTINATIONS.find((p) => p.id === destination)?.region === region) {
        destination = null;
      }
    }
    const sprinting = keys.has('shift') || touchSprint;
    const magnitude = Math.hypot(dx, dz);
    let walking = magnitude > 0 && !paused;
    let frameTravel = 0;
    const targetSpeed = sprinting ? SPRINT_SPEED : RUN_SPEED;
    moveSpeed = THREE.MathUtils.damp(moveSpeed, walking ? targetSpeed : 0, 24, dt);
    if (walking) {
      dx /= magnitude;
      dz /= magnitude;
      // Keep distant paths responsive while retaining perspective in the gait.
      const perspective = THREE.MathUtils.clamp((position.z - 15) / 70, 0.45, 1);
      const speed = moveSpeed * Math.max(perspective, 0.75);
      const step = Math.min(speed * dt, routeDistance);
      const next = movePlayer(position, dx * step, dz * step, region, keyboardWalking ? slide : undefined);
      const moved = Math.hypot(next.x - position.x, next.z - position.z);
      distance += moved;
      frameTravel = moved / Math.max(perspective, 0.45);
      walking = moved > 0.0001;
      if (walking) heading = Math.atan2(next.x - position.x, next.z - position.z);
      position = next;
      if (moved < 0.0001 && route.length && dt > 0) {
        route = [];
        destination = null;
      }
    }
    if (!paused) {
      if (region !== 'home' || !isNearHomeBed(position)) sleepBlocked = false;
      if (region === 'home' && isAtHomeBed(position)) void startSleep();
      if (blockedPortal && !isInsidePortal(position, blockedPortal)) {
        blockedPortal = null;
        cancelledPortal = null;
      }
      const portal = portalAt(position, region);
      if (!portal) waitingPortal = null;
      else if (portal !== blockedPortal) enterPortal(portal);
    }
    const scale = characterScale(position.z);
    const size = scale * CHILD_SIZE;
    const rest = sleeping ? bedRest.update(darkness, lampGlowAt(region, HOME_BED), reducedMotion) : null;
    const visualPosition = rest?.point ?? position;
    let characterDt = paused ? 0 : dt;
    let characterTravel = jump.height > 0 ? frameTravel * 0.2 : frameTravel;
    if (rest) {
      characterDt = dt;
      characterTravel = rest.walking ? dt * 6 : 0;
    }
    child.scale.setScalar(size);
    character.setOpacity(rest?.opacity ?? 1);
    const { hasStepped } = character.update(
      characterDt,
      characterTravel,
      rest?.heading ?? heading,
      rest?.walking ?? walking,
      true,
      reducedMotion,
      jump.height,
      jump.velocity,
      jump.landing,
    );
    const isFootfall = !paused && region === regionBefore && (hasLanded || hasStepped);
    if (isFootfall) {
      const surface = surfaceAt(position, region);
      container.dataset.surface = surface;
      onStep(surface, ((hasLanded ? LANDING_LOUDNESS : 1) * scale) / NEAREST_SCALE);
    }
    child.position.set(visualPosition.x * 1.2 - 60, 40 - visualPosition.z * 0.8 + jump.height * scale, 2);
    shadow.position.set(child.position.x + scale * 0.3, 40 - visualPosition.z * 0.8 - 0.08, 1);
    const shadowSize = 1 - Math.min(jump.height * 0.12, 0.3);
    shadow.scale.set(3.8 * size * shadowSize, 1.1 * size * shadowSize, 1);
    shadowMat.opacity = (rest?.opacity ?? 1) * (1 - Math.min(jump.height * 0.22, 0.55));
    const maxX = Math.max(0, 60 - halfWidth),
      maxY = Math.max(0, 40 - halfHeight);
    const cameraX = THREE.MathUtils.clamp(child.position.x * (halfWidth < 35 ? 1 : 0), -maxX, maxX);
    const cameraY = THREE.MathUtils.clamp(Math.min(0, child.position.y + halfHeight - 7), -maxY, maxY);
    const characterHeight = 10.4 * size;
    const characterHalfWidth = 3.9 * size;
    const keepX = (x: number) =>
      constrainCameraAxis(
        x,
        halfWidth,
        60,
        child.position.x - characterHalfWidth,
        child.position.x + characterHalfWidth,
      );
    const keepY = (y: number) =>
      constrainCameraAxis(y, halfHeight, 40, child.position.y - 1, child.position.y + characterHeight);
    // Damp toward a target that already respects the painting edges, so the camera can actually arrive.
    const targetX = keepX(cameraX);
    const targetY = keepY(cameraY);
    const cameraLag = reducedMotion ? 100 : 3;
    camera.position.x = keepX(
      settle(THREE.MathUtils.damp(camera.position.x, targetX, cameraLag, dt), targetX, CAMERA_EPSILON),
    );
    camera.position.y = keepY(
      settle(THREE.MathUtils.damp(camera.position.y, targetY, cameraLag, dt), targetY, CAMERA_EPSILON),
    );
    markers.forEach((marker, i) => {
      const point = DESTINATIONS[i]!;
      marker.visible = point.region === region && !sleeping;
      marker.position.y = 40 - point.z * 0.8 + 2 + (reducedMotion ? 0 : Math.sin(sceneryTime * 1.5 + i) * 0.17);
    });
    portalVisuals.update(region);
    targetMarker.visible = route.length > 0;
    if (route.length) {
      const target = route[route.length - 1]!;
      targetMarker.position.set(target.x * 1.2 - 60, 40 - target.z * 0.8 + 0.5, 1);
    }
    const targetWarmth = WARMTH_BY_TIME[timeOfDay];
    warmth = settle(THREE.MathUtils.damp(warmth, targetWarmth, 2, dt), targetWarmth, WARMTH_EPSILON);
    const targetDarkness = timeOfDay === TIME.night ? 1 : 0;
    darkness = settle(THREE.MathUtils.damp(darkness, targetDarkness, 2, dt), targetDarkness, WARMTH_EPSILON);
    background.uniforms.night!.value = darkness;
    fireflies.update(sceneryTime, region === 'home' ? 0 : darkness, reducedMotion);
    nightLights.update(region, darkness, sceneryTime, reducedMotion);
    background.uniforms.walker!.value.set((child.position.x + 60) / 120, (child.position.y + 40 + 1.8 * size) / 80);
    placeEffects.update(paused ? 0 : dt);
    const targetWetness = weather === WEATHER.rain ? 1 : 0;
    wetness = settle(THREE.MathUtils.damp(wetness, targetWetness, 1.5, dt), targetWetness, WARMTH_EPSILON);
    background.uniforms.rain!.value = region === 'home' ? 0 : wetness;
    background.uniforms.outdoorRain!.value = wetness;
    rain.update(paused ? 0 : dt, region === 'home' ? 0 : wetness, camera.position, reducedMotion, darkness);
    life.update({
      region,
      dt: paused ? 0 : dt,
      elapsed: sceneryTime,
      darkness,
      isStill: reducedMotion,
      isRaining: wetness > 0.5,
    });
    waves.update({ region, dt: paused ? 0 : dt, darkness, isStill: reducedMotion, rain: wetness });
    boats.update({ region, dt: paused ? 0 : dt, darkness, isStill: reducedMotion });
    leaves.update(region, paused ? 0 : dt, darkness, wetness, reducedMotion);
    countryside.update({
      region,
      dt: paused ? 0 : dt,
      darkness,
      isStill: reducedMotion,
      isRaining: wetness > 0.5,
      player: position,
    });
    roamers.update({
      region,
      dt: paused ? 0 : dt,
      darkness,
      isStill: reducedMotion,
      isRaining: wetness > 0.5,
      childZ: position.z,
    });
    container.dataset.visitor = roamers.visitor;
    const walkers = [rest ? null : { ...position, order: CHILD_ORDER }, roamers.standing].filter(
      (walker) => walker !== null,
    );
    foregrounds.forEach((layer) => {
      const order = foregroundOrder(layer, walkers, region);
      layer.mesh.visible = order !== null;
      layer.mesh.renderOrder = order ?? 0;
    });
    character.setLight(darkness, lampGlowAt(region, position));
    transition = Math.min(1, transition + dt * 1.8);
    background.uniforms.time!.value = reducedMotion ? 0 : sceneryTime;
    background.uniforms.evening!.value = warmth;
    background.uniforms.fade!.value = transition;
    dustMat.opacity = (region === 'home' ? 0.28 : 0.45) * (1 - darkness * 0.85) * (1 - wetness * 0.8);
    if (!reducedMotion && !paused) {
      for (let i = 0; i < 45; i++) {
        dust[i * 3] = dust[i * 3]! + dt * (0.15 + i * 0.002);
        dust[i * 3 + 1] = dust[i * 3 + 1]! + Math.sin(elapsed * 0.4 + i) * dt * 0.06;
        if (dust[i * 3]! > 60) dust[i * 3] = -60;
      }
      dustGeo.attributes.position!.needsUpdate = true;
    }
    isSettling =
      camera.position.x !== targetX ||
      camera.position.y !== targetY ||
      warmth !== targetWarmth ||
      darkness !== targetDarkness ||
      wetness !== targetWetness ||
      (!paused && placeEffects.isPlaying) ||
      transition < 1 ||
      (!paused && jump.landing > 0.01) ||
      sleeping;
    if (elapsed - statusTime > 0.12) {
      container.dataset.motion = sleeping ? 'sleeping' : motionLabel(jump.height > 0, walking, sprinting);
      let restLabel = sleeping ? 'settling' : '';
      if (rest && rest.tucked > 0.99) restLabel = 'tucked';
      container.dataset.rest = restLabel;
      const nextStatus: SceneStatus = {
        ...position,
        region,
        walking,
        nearby: closestLandmark(position.x, position.z, region),
        steps: Math.floor(distance * 5),
      };
      if (
        !previousStatus ||
        nextStatus.x !== previousStatus.x ||
        nextStatus.z !== previousStatus.z ||
        nextStatus.region !== previousStatus.region ||
        nextStatus.walking !== previousStatus.walking ||
        nextStatus.nearby !== previousStatus.nearby ||
        nextStatus.steps !== previousStatus.steps
      ) {
        previousStatus = nextStatus;
        onStatus(nextStatus);
      }
      statusTime = elapsed;
    }
    renderer.render(scene, camera);
    animation = requestAnimationFrame(tick);
  }
  animation = requestAnimationFrame(tick);
  plates.focus(nearbyRegions(START_REGION));
  return {
    async setAppearance(next) {
      const request = ++appearanceRequest;
      const url = characterAtlas(next);
      try {
        let texture = appearances.get(url);
        if (!texture) {
          texture = preparePaintingTexture(await loader.loadAsync(url));
          if (disposed) {
            texture.dispose();
            return false;
          }
          appearances.set(url, texture);
          loaded.push(texture);
        }
        if (disposed || request !== appearanceRequest) return false;
        currentAppearance = next;
        character.setAtlas(texture);
        container.dataset.appearance = `${next.character}-${next.outfit}`;
        if (region === 'home') void bedRest.prepare(next.character);
        wake();
        return true;
      } catch {
        return false;
      }
    },
    finishSleep() {
      sleeping = false;
      bedRest.finish();
      character.setOpacity(1);
      wake();
    },
    setWeather(value) {
      weather = value;
      wake();
    },
    setTimeOfDay(value) {
      timeOfDay = value;
      wake();
    },
    setPaused(value) {
      paused = value;
      keys.clear();
      // A dialog covers the scenery, so a half-played action is dropped rather than frozen under it.
      if (value) placeEffects.clear();
      wake();
    },
    setInput(key, pressed) {
      if (key === 'shift') {
        touchSprint = pressed;
        return;
      }
      if (key === ' ') {
        if (pressed && !paused) startJump(jump);
        return;
      }
      if (pressed && paused) return;
      if (pressed) {
        keys.add(key);
        if (key !== 'shift') {
          route = [];
          destination = null;
        }
      } else keys.delete(key);
    },
    playAction(kind, at) {
      const now = performance.now();
      if (now < actionEndsAt) return false;
      actionEndsAt = now + ACTION_LOCK_MS;
      if (!reducedMotion) placeEffects.play(kind, at);
      wake();
      return true;
    },
    travelTo(id) {
      destination = id;
      redirect(plan());
    },
    reset() {
      destination = null;
      switchRegion(START_REGION, SPAWN, startPlate.value);
      keys.clear();
    },
    photo() {
      renderer.render(scene, camera);
      const canvas = document.createElement('canvas');
      canvas.width = renderer.domElement.width;
      canvas.height = renderer.domElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return Promise.resolve(false);
      ctx.drawImage(renderer.domElement, 0, 0);
      ctx.fillStyle = '#fff9e8';
      ctx.font = `${Math.max(20, canvas.width / 55)}px serif`;
      ctx.shadowColor = '#18372c';
      ctx.shadowBlur = 5;
      ctx.fillText('여름빛 산책', canvas.width * 0.04, canvas.height * 0.95);
      return new Promise<boolean>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = `komorebi-${region}-${Date.now()}.png`;
          a.href = url;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          resolve(true);
        });
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(animation);
      observer.disconnect();
      listening.abort();
      foregrounds.forEach(({ mesh }) => mesh.geometry.dispose());
      foregroundMaterial.dispose();
      bedRest.dispose();
      portalVisuals.dispose();
      fireflies.dispose();
      placeEffects.dispose();
      nightLights.dispose();
      life.dispose();
      roamers.dispose();
      waves.dispose();
      boats.dispose();
      countryside.dispose();
      leaves.dispose();
      waterMaps.dispose();
      rain.dispose();
      geo.dispose();
      dustGeo.dispose();
      [background, shadowMat, dustMat, targetMat, ...markerMats].forEach((m) => m.dispose());
      releaseTextures();
      character.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
