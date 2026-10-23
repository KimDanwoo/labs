import { TIME, WEATHER, type TimeOfDay, type Weather } from '@features/walk/model/constants';
import { FOREGROUNDS, foregroundOrder } from '@shared/world/foreground';
import { getWorldPortals, isInsidePortal, portalAt, type WorldPortal } from '@shared/world/portals';
import { surfaceAt, type Surface } from '@shared/world/surfaces';
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
  type PlaceAction,
  type Point,
  type Region,
} from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { constrainCameraAxis } from './cameraBounds';
import { createChild } from './child';
import { createFireflies } from './fireflies';
import { gameKey, isControlTarget } from './input';
import { advanceJump, createJump, isAirborne, startJump } from './motion';
import { MAX_LAMPS, createNightLights, lampGlowAt, lampUniforms } from './nightLights';
import { CHILD_SIZE, characterScale } from './perspective';
import { createPlaceEffects } from './placeEffects';
import { createPortals } from './portals';
import { createRain } from './rain';
import { createRegionPlates, nearbyRegions, preparePaintingTexture } from './regionPlates';
import { RENDER_RATE, nextRenderTime, renderPixelRatio, settle, shouldRenderFrame } from './renderBudget';
import { createRoamers } from './roamers';
import { createSceneLife } from './sceneLife';
import { createWaterMaps } from './water';

const CHILD_ATLAS_URL = '/art/child-motion-v2-ready.webp';
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
  signal?: AbortSignal;
};
export type WalkEngine = {
  dispose: () => void;
  /** While paused (a dialog is open) the child stands still and new movement input is ignored. */
  setPaused: (value: boolean) => void;
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
  { onStatus, onNotice, onStep, signal }: SceneOptions,
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
      isSea: { value: START_REGION === SEA_REGION ? 1 : 0 },
      shoreMap: { value: waterMaps.shoreOf(START_REGION) },
      foam: waterMaps.foam,
      fade: { value: 1 },
    },
    vertexShader:
      'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv; uniform sampler2D map; uniform float time; uniform float evening; uniform float night; uniform float rain; uniform float fade;
      uniform vec3 lamps[${MAX_LAMPS}]; uniform int lampCount; uniform vec2 walker; uniform sampler2D waterMap; uniform float isSea; uniform sampler2D shoreMap; uniform sampler2D foam; 
      void main(){
        vec2 uv=vUv;
        // Tiny local leaf motion, not a global distortion of architecture.
        float canopy=smoothstep(.45,.82,uv.y)*(1.-smoothstep(.08,.34,uv.x));
        uv.x+=sin(time*.6+uv.y*32.)*.00045*canopy;
        // Rivers carry broken foam downstream and spray off the rocks; the sea rolls a few soft crests in and
        // breaks each wave into lace along its shores, which then drains away. Designed by Codex.
        const float W_TAU = 6.28318530718;

        vec4 water = texture2D(waterMap, vUv);                  // 1
        vec4 shore = texture2D(shoreMap, vUv);                  // 2

        float sea = clamp(isSea, 0., 1.);
        float nearWater = 1. - vUv.y;
        float wt = time * (1. + rain * .20);
        vec2 p = vec2(vUv.x * 1.5, nearWater);

        float wet = smoothstep(.12, .78, water.r);
        vec2 flow = (water.gb * 255. - 128.) / 127.;
        float pace = length(flow);
        float speed = clamp(pace, 0., 1.);
        float river = (1. - sea) * smoothstep(.025, .12, pace);

        vec2 riverDir = vec2(0., 1.);
        if (pace > .025) {
          riverDir = normalize(flow * vec2(1.5, 1.));
        }

        float shoreDistance = (shore.r - .5) * .12;
        float shoreStrength = clamp(shore.a, 0., 1.);

        // Offshore waves keep one direction. Shore normals do not define phase.
        vec2 seaDir = normalize(vec2(.16, 1.));
        vec2 advectDir = mix(riverDir, seaDir, sea);
        float velocity = mix(.012 + .027 * speed, .0045, sea);

        // Fixed texture coordinates; the flow field only offsets the lookup.
        float phaseA = fract(wt / 4.8);
        float phaseB = fract(phaseA + .5);
        float weightA = .5 - .5 * cos(W_TAU * phaseA);
        vec2 backA = p - advectDir * velocity * (phaseA * 4.8);
        vec2 backB = p - advectDir * velocity * (phaseB * 4.8);

        // The supplied image already contains elongated lace.
        // Keep individual holes visible instead of shrinking them into lines.
        vec2 foamScale = mix(vec2(13., 4.5), vec2(9., 11.), sea);
        float foamA = texture2D(
          foam, backA * foamScale + vec2(.17, .31)
        ).r;                                                     // 3
        float foamB = texture2D(
          foam, backB * foamScale + vec2(.17, .31)
        ).r;                                                     // 4

        float lace = mix(
          smoothstep(.20, .72, foamB),
          smoothstep(.20, .72, foamA),
          weightA
        );
        float tips = mix(
          smoothstep(.58, .92, foamB),
          smoothstep(.58, .92, foamA),
          weightA
        );

        // A separate, broad mask breaks up the foam coverage.
        float patchMask = texture2D(
          foam, p * vec2(2.1, 2.7) + vec2(-wt * .0015, .43)
        ).r;                                                     // 5
        float islands = smoothstep(.22, .68, patchMask);

        uv = mix(uv, vUv, wet);
        vec4 tex = texture2D(map, uv);                            // 6

        float waterColour =
          smoothstep(.008, .080, max(tex.g, tex.b) - tex.r) *
          smoothstep(.70, .98, tex.b / max(tex.g, .001));
        float waterEffect = wet * waterColour;

        // Fixed-distance probes avoid the old resetting wake sweep.
        vec2 riverUv = vec2(riverDir.x / 1.5, -riverDir.y);
        vec2 nearUv = clamp(
          vUv - riverUv * .0035, vec2(.001), vec2(.999)
        );
        vec2 farUv = clamp(
          vUv - riverUv * (.010 + .010 * speed),
          vec2(.001), vec2(.999)
        );
        vec3 nearTex = texture2D(map, nearUv).rgb;                 // 7
        vec3 farTex = texture2D(map, farUv).rgb;                   // 8

        float nearColour =
          smoothstep(.008, .080, max(nearTex.g, nearTex.b) - nearTex.r) *
          smoothstep(.70, .98, nearTex.b / max(nearTex.g, .001));
        float farColour =
          smoothstep(.008, .080, max(farTex.g, farTex.b) - farTex.r) *
          smoothstep(.70, .98, farTex.b / max(farTex.g, .001));

        float contact = (1. - nearColour) * waterColour;
        float wake = (1. - farColour) * waterColour;

        // Broad, intermittent foam fragments travelling down the river.
        float riverSurface = river * lace * islands * (.035 + .065 * speed);
        float riverSpray = river * (
          contact * (.24 + .64 * lace) +
          wake * lace * (.15 + .30 * islands)
        ) * (.65 + .55 * speed);

        // One front approaches the shore, breaks, and leaves a fading wash.
        // Spatial variation changes arrival time, never the local period.
        float coastOffset =
          .09 * sin(p.x * 8. + p.y * 3.) +
          .04 * sin(p.x * 17. - p.y * 5.);
        float cycle = fract(wt / 7.2 + .29 + coastOffset);

        float approach = smoothstep(.04, .52, cycle);
        float retreat = smoothstep(.57, .96, cycle);
        float frontDistance =
          mix(.020, .0015, approach) + .006 * retreat;

        float frontWidth = .0028 + .0018 * approach;
        float front = 1. - smoothstep(
          frontWidth * .30,
          frontWidth,
          abs(shoreDistance - frontDistance)
        );
        float frontLife =
          smoothstep(.00, .12, cycle) *
          (1. - smoothstep(.64, .91, cycle));

        // Water-side clipping, softened for the encoded distance resolution.
        float shoreBand =
          smoothstep(-.0015, .0015, shoreDistance) *
          (1. - smoothstep(.022, .029, shoreDistance));

        // Residual lace occupies the water between the coast and the front.
        float washArea =
          1. - smoothstep(
            frontDistance + .001,
            frontDistance + .006,
            shoreDistance
          );
        float washLife =
          smoothstep(.24, .53, cycle) *
          (1. - smoothstep(.65, .99, cycle));

        float coastLace =
          front * frontLife * (.10 + .90 * lace) +
          washArea * washLife * lace * .38;

        // A little attached foam remains between breaking waves.
        float attached =
          (1. - smoothstep(.0015, .0055, shoreDistance)) *
          lace * .16;

        float seaFoam =
          sea * shoreBand *
          mix(.65, 1., shoreStrength) *
          (coastLace + attached);

        // A few broad, broken offshore crests.
        // Fixed direction and wavelength prevent the curved phase-field artifact.
        float swellPhase = W_TAU * (
          dot(p, seaDir) / .145 - wt / 12.0
        );
        swellPhase += .24 * sin(p.x * 9.);
        float swell = .5 + .5 * cos(swellPhase);
        float crest = smoothstep(.88, .995, swell);
        float offshore = smoothstep(.025, .055, shoreDistance);
        float seaDepth = smoothstep(.16, .34, nearWater);
        float openCrest =
          sea * seaDepth * offshore * crest * lace *
          (.12 + .88 * islands);

        // Rain changes existing irregular shapes instead of adding scanlines.
        float rainTexture =
          rain * tips * islands * (.025 * sea + .045 * river);

        float waterHighlights = waterEffect * (
          riverSurface +
          openCrest * .11 +
          rainTexture
        );

        // Shore foam must survive over the painting's pale water.
        // Accurate water polygons remain necessary to protect land and objects.
        float shoreCoverage = wet * mix(.30, 1., waterColour);
        float waterFoam = clamp(
          shoreCoverage * seaFoam * (1. + rain * .15) +
          waterEffect * (
            openCrest * .30 +
            riverSpray * (1. + rain * .20)
          ),
          0., .88
        );

        vec3 c = tex.rgb;
        float trough =
          sea * seaDepth * offshore * (1. - swell) * .012;
        c *= 1. - waterEffect * trough * (1. - night * .9);
        vec3 warm=c*vec3(1.09,.79,.67)+vec3(.025,.005,.018);
        c=mix(c,warm,evening*.65);
        // Linear light: these factors read about twice as bright once converted for the screen.
        vec3 base=c;
        vec3 grey=vec3(dot(c,vec3(.3,.59,.11)));
        vec3 moonlit=mix(c,grey,.45)*vec3(.09,.12,.24)+vec3(.0,.003,.015);
        c=mix(c,moonlit,night*.9);
        // After dark, windows, lanterns and the walker's glow give the painting back its colour in warm pools.
        float pool=0.;
        for(int i=0;i<${MAX_LAMPS};i++){
          if(i>=lampCount) break;
          vec2 d=(uv-lamps[i].xy)*vec2(1.5,1.);
          pool+=1.-smoothstep(0.,lamps[i].z*2.2,length(d));
        }
        float carry=1.-smoothstep(0.,.13,length((uv-walker)*vec2(1.5,1.)));
        vec3 lamplit=base*vec3(1.05,.84,.58);
        c=mix(c,lamplit,clamp(pool*.85+carry*.35,0.,.9)*night);
        // Highlights and foam take the light of the hour: paint-white by day, moon and lamps by night.
        float moonCentre = .64 + .018 * sin(vUv.y * 17.);
        float moonWidth = mix(.035, .15, nearWater);
        float moon = 1. - smoothstep(
          moonWidth * .25, moonWidth, abs(vUv.x - moonCentre)
        );
        moon *= smoothstep(.06, .22, vUv.y) *
                (1. - smoothstep(.86, .98, vUv.y));

        float lampLight = clamp(pool * .65, 0., 1.);
        float moonLight = moon * (1. - rain * .85);

        vec3 daylightColour = mix(
          vec3(.78, .91, .96),
          vec3(1., .79, .53),
          evening * .65
        );
        vec3 reflectedLight = mix(
          daylightColour * (.42 * (1. - rain * .20)),
          vec3(.40, .58, .90) * moonLight * .075 +
            vec3(1., .76, .43) * lampLight * .35,
          night
        );
        c += waterHighlights * reflectedLight;

        vec3 foamDay = mix(
          vec3(.84, .90, .86),
          vec3(.94, .78, .57),
          evening * .55
        );
        vec3 foamNight =
          vec3(.004, .008, .015) +
          vec3(.40, .58, .86) * moonLight * .095 +
          vec3(1., .76, .44) * lampLight * .42;
        vec3 foamColour = mix(foamDay, foamNight, night);
        c = mix(c, foamColour, waterFoam);
        float edge=1.-smoothstep(.3,.95,length((uv-vec2(.5,.45))*vec2(1.1,1.35)));
        c*=mix(1.,.55+.45*edge,night);
        vec3 overcast=mix(c,vec3(dot(c,vec3(.3,.59,.11))),.5)*vec3(.6,.66,.72);
        c=mix(c,overcast,rain*.8);
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
    part.renderOrder = CHILD_ORDER;
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
  const fireflies = createFireflies(scene);
  const placeEffects = createPlaceEffects(scene);
  const nightLights = createNightLights(scene);
  const life = createSceneLife(scene, loader);
  const roamers = createRoamers(scene, loader);
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
    const lamps = lampUniforms(next);
    background.uniforms.lamps!.value = lamps.values;
    background.uniforms.waterMap!.value = waterMaps.of(next);
    background.uniforms.shoreMap!.value = waterMaps.shoreOf(next);
    background.uniforms.isSea!.value = next === SEA_REGION ? 1 : 0;
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
    if (!paused) advanceJump(jump, dt);
    const hasLanded = !paused && wasAirborne && !isAirborne(jump);
    const regionBefore = region;
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
    const size = scale * CHILD_SIZE;
    child.scale.setScalar(size);
    const { hasStepped } = character.update(
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
    const isFootfall = !paused && region === regionBefore && (hasLanded || hasStepped);
    if (isFootfall) {
      const surface = surfaceAt(position, region);
      container.dataset.surface = surface;
      onStep(surface, ((hasLanded ? LANDING_LOUDNESS : 1) * scale) / NEAREST_SCALE);
    }
    child.position.set(position.x * 1.2 - 60, 40 - position.z * 0.8 + jump.height * scale, 2);
    shadow.position.set(child.position.x + scale * 0.3, 40 - position.z * 0.8 - 0.08, 1);
    const shadowSize = 1 - Math.min(jump.height * 0.12, 0.3);
    shadow.scale.set(3.8 * size * shadowSize, 1.1 * size * shadowSize, 1);
    shadowMat.opacity = 1 - Math.min(jump.height * 0.22, 0.55);
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
    const targetWarmth = WARMTH_BY_TIME[timeOfDay];
    warmth = settle(THREE.MathUtils.damp(warmth, targetWarmth, 2, dt), targetWarmth, WARMTH_EPSILON);
    const targetDarkness = timeOfDay === TIME.night ? 1 : 0;
    darkness = settle(THREE.MathUtils.damp(darkness, targetDarkness, 2, dt), targetDarkness, WARMTH_EPSILON);
    background.uniforms.night!.value = darkness;
    fireflies.update(elapsed, darkness, reducedMotion);
    nightLights.update(region, darkness, elapsed, reducedMotion);
    background.uniforms.walker!.value.set((child.position.x + 60) / 120, (child.position.y + 40 + 1.8 * size) / 80);
    placeEffects.update(paused ? 0 : dt);
    const targetWetness = weather === WEATHER.rain ? 1 : 0;
    wetness = settle(THREE.MathUtils.damp(wetness, targetWetness, 1.5, dt), targetWetness, WARMTH_EPSILON);
    background.uniforms.rain!.value = wetness;
    rain.update(paused ? 0 : dt, wetness, camera.position, reducedMotion);
    life.update({ region, dt: paused ? 0 : dt, elapsed, darkness, isStill: reducedMotion, isRaining: wetness > 0.5 });
    roamers.update({
      region,
      dt: paused ? 0 : dt,
      darkness,
      isStill: reducedMotion,
      isRaining: wetness > 0.5,
      childZ: position.z,
    });
    container.dataset.visitor = roamers.visitor;
    const walkers = [{ ...position, order: CHILD_ORDER }, roamers.standing].filter((walker) => walker !== null);
    foregrounds.forEach((layer) => {
      const order = foregroundOrder(layer, walkers, region);
      layer.mesh.visible = order !== null;
      layer.mesh.renderOrder = order ?? 0;
    });
    character.setLight(darkness, lampGlowAt(region, position));
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
      darkness !== targetDarkness ||
      wetness !== targetWetness ||
      (!paused && placeEffects.isPlaying) ||
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
  plates.focus(nearbyRegions(START_REGION));
  return {
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
      fireflies.dispose();
      placeEffects.dispose();
      nightLights.dispose();
      life.dispose();
      roamers.dispose();
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
