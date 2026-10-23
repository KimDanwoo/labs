import { FOREGROUNDS, isForegroundInFront } from '@shared/world/foreground';
import { getWorldPortals, isInsidePortal, portalAt, type WorldPortal } from '@shared/world/portals';
import {
  LANDMARKS,
  SPAWN,
  WORLDS,
  canWalk,
  closestLandmark,
  createSlideMotion,
  findRoute,
  movePlayer,
  nextRegionStep,
  type Landmark,
  type Point,
  type Region,
} from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { constrainCameraAxis } from './cameraBounds';
import { createChild } from './child';
import { gameKey, isControlTarget } from './input';
import { advanceJump, createJump, startJump } from './motion';
import { characterScale } from './perspective';
import { createPortals } from './portals';
import { createRegionPlates, preparePaintingTexture } from './regionPlates';
import { RENDER_RATE, nextRenderTime, renderPixelRatio, settle, shouldRenderFrame } from './renderBudget';

const CHILD_ATLAS_URL = '/art/child-motion-v2-ready.webp';
const START_REGION: Region = 'village';
const CAMERA_EPSILON = 0.01;
const WARMTH_EPSILON = 0.002;
const MOVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
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
  signal?: AbortSignal;
};
export type WalkEngine = {
  dispose: () => void;
  /** While paused (a dialog is open) the child stands still and new movement input is ignored. */
  setPaused: (value: boolean) => void;
  setEvening: (value: boolean) => void;
  setInput: (key: string, pressed: boolean) => void;
  reset: () => void;
  /** Resolves false when the browser could not encode the picture. */
  photo: () => Promise<boolean>;
  travelTo: (id: string) => void;
};

/** Painted scenery on depth-separated Three.js planes, with a hand-inked directional child and a connected walkable lane graph. */
export async function createScene(
  container: HTMLElement,
  { onStatus, onNotice, signal }: SceneOptions,
): Promise<WalkEngine> {
  const loader = new THREE.TextureLoader();
  const plates = createRegionPlates(loader);
  const loaded: THREE.Texture[] = [];
  const releaseTextures = () => {
    plates.dispose();
    loaded.forEach((texture) => texture.dispose());
  };
  // Only the first view blocks the start; the other paintings follow in the background.
  const [startPlate, atlas] = await Promise.allSettled([
    plates.ensure(START_REGION),
    loader.loadAsync(CHILD_ATLAS_URL),
  ]);
  if (atlas.status === 'fulfilled') loaded.push(preparePaintingTexture(atlas.value));
  if (startPlate.status === 'rejected' || atlas.status === 'rejected' || signal?.aborted) {
    releaseTextures();
    const failure = [startPlate, atlas].find((result) => result.status === 'rejected');
    throw failure?.reason ?? new DOMException('Scene cancelled', 'AbortError');
  }
  const childAtlas = atlas.value;
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
  const background = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: startPlate.value },
      time: { value: 0 },
      evening: { value: 0 },
      fade: { value: 1 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv; uniform sampler2D map; uniform float time; uniform float evening; uniform float fade; 
      void main(){
        vec2 uv=vUv;
        // Tiny local leaf motion, not a global distortion of architecture.
        float canopy=smoothstep(.45,.82,uv.y)*(1.-smoothstep(.08,.34,uv.x));
        uv.x+=sin(time*.6+uv.y*32.)*.00045*canopy;
        vec4 tex=texture2D(map,uv);
        vec3 c=tex.rgb;
        float blue=step(c.r*1.35,c.b)*step(c.g*.92,c.b);
        float waterMask=(1.-smoothstep(.45,.65,uv.y))*smoothstep(.55,.7,uv.x)*blue;
        float ripple=sin(uv.y*700.+sin(uv.x*80.+time*.2)*2.+time*1.2);
        float sparkle=smoothstep(.65,.95,sin(uv.x*240.+sin(uv.y*80.)*4.-time*.4));
        c+=waterMask*pow(max(0.,ripple),24.)*sparkle*.018;
        vec3 warm=c*vec3(1.09,.79,.67)+vec3(.025,.005,.018);
        c=mix(c,warm,evening*.65);
        gl_FragColor=vec4(c*fade,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Mesh(geo, background));
  const child = character.group;
  scene.add(child);
  // Group order sorts before mesh order: keep the group at the scene default
  // so the foreground can render after the character's individual sprites.
  child.children.forEach((part) => {
    part.renderOrder = 4;
  });
  // Reuse the painting shader and its live uniforms so lighting and transitions match.
  const foregroundMaterial = background.clone();
  foregroundMaterial.uniforms = background.uniforms;
  foregroundMaterial.transparent = true;
  foregroundMaterial.depthTest = false;
  foregroundMaterial.depthWrite = false;
  const foregrounds = FOREGROUNDS.map((layer) => {
    const shape = new THREE.Shape(
      layer.outline.map(([x, y]) => new THREE.Vector2((x / 1536) * 120 - 60, 40 - (y / 1024) * 80)),
    );
    const geometry = new THREE.ShapeGeometry(shape);
    const vertices = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < vertices.count; i++) uv.setXY(i, (vertices.getX(i) + 60) / 120, (vertices.getY(i) + 40) / 80);
    const mesh = new THREE.Mesh(geometry, foregroundMaterial);
    mesh.renderOrder = 4.5;
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
  const markerMats = LANDMARKS.map(
    () => new THREE.SpriteMaterial({ map: markerMap, transparent: true, depthTest: false }),
  );
  const markers = LANDMARKS.map((p, i) => {
    const s = new THREE.Sprite(markerMats[i]);
    s.position.set(p.x * 1.2 - 60, 40 - p.z * 0.8 + 2, 1);
    s.scale.set(1.7, 1.7, 1);
    s.renderOrder = 2;
    scene.add(s);
    return s;
  });
  const portalVisuals = createPortals(scene);
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
    evening = false,
    paused = false,
    isSettling = true,
    warmth = 0,
    transition = 1;
  let blockedPortal: WorldPortal | null = null;
  let waitingPortal: WorldPortal | null = null;
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
    renderer.setSize(w, h);
    wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  /** Routes toward the destination and returns the exit it heads for, if it leaves this region. */
  const plan = (): WorldPortal | null => {
    if (!destination) return null;
    const point = LANDMARKS.find((p) => p.id === destination);
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
    slide.direction = null;
    slide.input = null;
    position = { ...spawn };
    route = [];
    background.uniforms.map!.value = plate;
    transition = reducedMotion ? 1 : 0.25;
    blockedPortal = portalAt(position, region);
    waitingPortal = null;
    cancelledPortal = null;
    plan();
    wake();
    container.dataset.region = next;
  };
  container.dataset.region = region;
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
  const click = (event: PointerEvent) => {
    if (paused) return;
    renderer.domElement.focus({ preventScroll: true });
    const bounds = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
      ),
      camera,
    );
    const portal = portalVisuals.pick(ray, region);
    if (portal) {
      destination = null;
      redirect(portal);
      route = findRoute(position, portal.center, region);
      return;
    }
    const v = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v)) return;
    const point = { x: (v.x + 60) / 1.2, z: (40 - v.y) / 0.8 };
    if (!canWalk(point.x, point.z, region)) return;
    destination = null;
    redirect(null);
    route = findRoute(position, point, region);
  };
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '산책 게임. 방향키 또는 WASD로 이동, Shift로 전력 질주, Space로 점프');
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('pointerdown', click);
  motionQuery.addEventListener('change', motionPreference);
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
  function tick(time: number) {
    if (disposed || document.hidden) return;
    const isAirborne = jump.height > 0 || jump.velocity > 0;
    const hasMoveKey = MOVE_KEYS.some((key) => keys.has(key));
    const isMoving = !paused && (hasMoveKey || route.length > 0 || isAirborne || moveSpeed > 0.05);
    const rate = isMoving || isSettling ? RENDER_RATE.active : RENDER_RATE.idle;
    if (!shouldRenderFrame(time, nextFrame, rate)) {
      animation = requestAnimationFrame(tick);
      return;
    }
    nextFrame = nextRenderTime(time, nextFrame, rate);
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    elapsed += dt;
    if (!paused) advanceJump(jump, dt);
    let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    let dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
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
      } else if (destination && LANDMARKS.find((p) => p.id === destination)?.region === region) {
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
      if (blockedPortal && !isInsidePortal(position, blockedPortal)) {
        blockedPortal = null;
        cancelledPortal = null;
      }
      const portal = portalAt(position, region);
      if (!portal) waitingPortal = null;
      else if (portal !== blockedPortal) enterPortal(portal);
    }
    const scale = characterScale(position.z);
    child.scale.setScalar(scale * 1.65);
    character.update(
      paused ? 0 : dt,
      jump.height > 0 ? frameTravel * 0.2 : frameTravel,
      heading,
      walking,
      true,
      reducedMotion,
      jump.height,
      jump.velocity,
      jump.landing,
    );
    child.position.set(position.x * 1.2 - 60, 40 - position.z * 0.8 + jump.height * scale, 2);
    shadow.position.set(child.position.x + scale * 0.3, 40 - position.z * 0.8 - 0.08, 1);
    const shadowSize = 1 - Math.min(jump.height * 0.12, 0.3);
    shadow.scale.set(6.3 * scale * shadowSize, 1.8 * scale * shadowSize, 1);
    shadowMat.opacity = 1 - Math.min(jump.height * 0.22, 0.55);
    foregrounds.forEach((layer) => {
      layer.mesh.visible = isForegroundInFront(layer, position, region);
    });
    const maxX = Math.max(0, 60 - halfWidth),
      maxY = Math.max(0, 40 - halfHeight);
    const cameraX = THREE.MathUtils.clamp(child.position.x * (halfWidth < 35 ? 1 : 0), -maxX, maxX);
    const cameraY = THREE.MathUtils.clamp(Math.min(0, child.position.y + halfHeight - 7), -maxY, maxY);
    const characterHeight = 10.4 * scale * 1.65;
    const characterHalfWidth = 3.9 * scale * 1.65;
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
      const point = LANDMARKS[i]!;
      marker.visible = point.region === region;
      marker.position.y = 40 - point.z * 0.8 + 2 + (reducedMotion ? 0 : Math.sin(elapsed * 1.5 + i) * 0.17);
    });
    portalVisuals.update(region);
    targetMarker.visible = route.length > 0;
    if (route.length) {
      const target = route[route.length - 1]!;
      targetMarker.position.set(target.x * 1.2 - 60, 40 - target.z * 0.8 + 0.5, 1);
    }
    const targetWarmth = evening ? 1 : 0;
    warmth = settle(THREE.MathUtils.damp(warmth, targetWarmth, 2, dt), targetWarmth, WARMTH_EPSILON);
    transition = Math.min(1, transition + dt * 1.8);
    background.uniforms.time!.value = reducedMotion ? 0 : elapsed;
    background.uniforms.evening!.value = warmth;
    background.uniforms.fade!.value = transition;
    if (!reducedMotion) {
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
      transition < 1 ||
      (!paused && jump.landing > 0.01);
    if (elapsed - statusTime > 0.12) {
      container.dataset.motion = motionLabel(jump.height > 0, walking, sprinting);
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
  plates.preload((Object.keys(WORLDS) as Region[]).filter((other) => other !== START_REGION));
  return {
    setEvening(value) {
      evening = value;
      wake();
    },
    setPaused(value) {
      paused = value;
      keys.clear();
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
      ctx.fillText('木漏れ日  /  여름빛 산책', canvas.width * 0.04, canvas.height * 0.95);
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
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', visibility);
      motionQuery.removeEventListener('change', motionPreference);
      renderer.domElement.removeEventListener('pointerdown', click);
      foregrounds.forEach(({ mesh }) => mesh.geometry.dispose());
      foregroundMaterial.dispose();
      portalVisuals.dispose();
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
