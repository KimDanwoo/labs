import {
  LANDMARKS,
  SPAWN,
  WORLDS,
  canWalk,
  closestLandmark,
  findRoute,
  movePlayer,
  nextRegionStep,
  type Landmark,
  type Point,
  type Region,
} from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { createChild } from './child';
import { gameKey } from './input';
import { advanceJump, createJump, startJump } from './motion';

export type SceneStatus = Point & {
  region: Region;
  walking: boolean;
  nearby: Landmark | null;
  steps: number;
};
export type WalkEngine = {
  dispose: () => void;
  setEvening: (value: boolean) => void;
  setInput: (key: string, pressed: boolean) => void;
  reset: () => void;
  photo: () => void;
  travelTo: (id: string) => void;
};

/** Painted scenery on depth-separated Three.js planes, with a hand-inked directional child and a connected walkable lane graph. */
export async function createScene(
  container: HTMLElement,
  onStatus: (status: SceneStatus) => void,
  signal?: AbortSignal,
): Promise<WalkEngine> {
  const loader = new THREE.TextureLoader();
  const plates = {} as Record<Region, THREE.Texture>;
  const loaded: THREE.Texture[] = [];
  const regions = Object.keys(WORLDS) as Region[];
  // Load concurrently, but settle every request before cleaning up a failed load.
  const results = await Promise.allSettled(
    [...regions.map((region) => WORLDS[region].image), '/art/child-walk-atlas.webp'].map((url) =>
      loader.loadAsync(url),
    ),
  );
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    result.value.colorSpace = THREE.SRGBColorSpace;
    result.value.generateMipmaps = false;
    result.value.minFilter = THREE.LinearFilter;
    loaded.push(result.value);
  }
  const failure = results.find((result) => result.status === 'rejected');
  if (failure || signal?.aborted) {
    loaded.forEach((texture) => texture.dispose());
    throw failure?.reason ?? new DOMException('Scene cancelled', 'AbortError');
  }
  regions.forEach((region, index) => {
    plates[region] = loaded[index]!;
  });
  const childAtlas = loaded[regions.length]!;
  let character: ReturnType<typeof createChild>;
  try {
    character = createChild(childAtlas);
  } catch (error) {
    loaded.forEach((texture) => texture.dispose());
    throw error;
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
  } catch (error) {
    character.dispose();
    loaded.forEach((t) => t.dispose());
    throw error;
  }
  // Cap fill rate on touch devices without changing the CSS viewport.
  const pixelRatioLimit = window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioLimit));
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
      map: { value: plates.village },
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
        c+=waterMask*pow(max(0.,sin(uv.x*550.+uv.y*140.+time*1.2)),26.)*.035;
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
  const exitSigns: { region: Region; sprite: THREE.Sprite }[] = [];
  const exitMaterials: THREE.SpriteMaterial[] = [];
  for (const [key, world] of Object.entries(WORLDS))
    for (const portal of world.portals) {
      const node = world.nodes.find((n) => n.id === portal.node)!;
      const texture = canvasTexture(256, 80, (c) => {
        c.fillStyle = '#fff8dfed';
        c.beginPath();
        c.roundRect(4, 8, 248, 64, 18);
        c.fill();
        c.strokeStyle = '#9b9e78';
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = '#536a48';
        c.font = 'bold 27px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(`${node.x < 15 ? '← ' : ''}${portal.label}${node.x > 85 ? ' →' : node.z > 90 ? ' ↓' : ''}`, 128, 42);
      });
      loaded.push(texture);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      exitMaterials.push(material);
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(8, 2.5, 1);
      sprite.position.set(THREE.MathUtils.clamp(node.x, 8, 92) * 1.2 - 60, 40 - Math.min(node.z, 91) * 0.8 + 2.5, 1);
      sprite.renderOrder = 2;
      scene.add(sprite);
      exitSigns.push({ region: key as Region, sprite });
    }
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

  let region: Region = 'village',
    position = { ...SPAWN },
    route: Point[] = [],
    destination: string | null = null;
  let elapsed = 0,
    last = 0,
    statusTime = -1,
    distance = 0,
    animation = 0,
    disposed = false,
    evening = false,
    warmth = 0,
    transition = 1,
    portalCooldown = 0;
  let heading = 0,
    moveSpeed = 0,
    touchSprint = false;
  const jump = createJump();
  const keys = new Set<string>();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    renderer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const plan = () => {
    if (!destination) return;
    const point = LANDMARKS.find((p) => p.id === destination);
    if (!point) return;
    if (point.region === region) route = findRoute(position, point, region);
    else {
      const portal = WORLDS[region].portals.find((p) => p.to === nextRegionStep(region, point.region))!;
      route = findRoute(
        position,
        WORLDS[region].nodes.find((n) => n.id === portal.node)!,
        region,
      );
    }
  };
  const switchRegion = (next: Region, spawn: Point) => {
    jump.height = 0;
    jump.velocity = 0;
    jump.landing = 0;
    region = next;
    position = { ...spawn };
    route = [];
    background.uniforms.map!.value = plates[region];
    transition = reducedMotion ? 1 : 0.25;
    portalCooldown = 2.5;
    plan();
    container.dataset.region = next;
  };
  container.dataset.region = region;
  const keyDown = (event: KeyboardEvent) => {
    if (
      (event.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(event.target.tagName)) ||
      document.querySelector('dialog[open]')
    )
      return;
    const key = gameKey(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (key === ' ' && !event.repeat) startJump(jump);
    keys.add(key);
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      route = [];
      destination = null;
    }
  };
  let previousStatus: SceneStatus | undefined;
  const keyUp = (event: KeyboardEvent) => keys.delete(gameKey(event));
  const clear = () => {
    keys.clear();
    last = 0;
  };
  const visibility = () => {
    clear();
    cancelAnimationFrame(animation);
    if (!document.hidden && !disposed) animation = requestAnimationFrame(tick);
  };
  const click = (event: PointerEvent) => {
    if (document.querySelector('dialog[open]')) return;
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
    const v = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), v)) return;
    const point = { x: (v.x + 60) / 1.2, z: (40 - v.y) / 0.8 };
    if (!canWalk(point.x, point.z, region)) return;
    destination = null;
    route = findRoute(position, point, region);
  };
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '산책 게임. 방향키 또는 WASD로 이동, Shift로 달리기, Space로 점프');
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('pointerdown', click);
  function tick(time: number) {
    if (disposed || document.hidden) return;
    const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
    last = time;
    elapsed += dt;
    portalCooldown -= dt;
    const paused = !!document.querySelector('dialog[open]') || document.hidden;
    if (paused) keys.clear();
    else advanceJump(jump, dt);
    let dx = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
    let dz = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
    const keyboardWalking = Math.hypot(dx, dz) > 0;
    if (!paused && !keyboardWalking && route.length) {
      const next = route[0]!;
      const d = Math.hypot(next.x - position.x, next.z - position.z);
      if (d < 0.45) {
        route.shift();
        if (!route.length && destination && LANDMARKS.find((p) => p.id === destination)?.region === region)
          destination = null;
      } else {
        dx = (next.x - position.x) / d;
        dz = (next.z - position.z) / d;
      }
    }
    const running = keys.has('shift') || touchSprint;
    const magnitude = Math.hypot(dx, dz);
    let walking = magnitude > 0 && !paused;
    let frameTravel = 0;
    moveSpeed = THREE.MathUtils.damp(moveSpeed, walking ? (running ? 24 : 14) : 0, 24, dt);
    if (walking) {
      dx /= magnitude;
      dz /= magnitude;
      // Perspective: distant steps cover less picture space than foreground steps.
      const perspective = THREE.MathUtils.clamp((position.z - 15) / 70, 0.45, 1);
      const speed = moveSpeed * perspective;
      const next = movePlayer(position, dx * speed * dt, dz * speed * dt, region);
      const moved = Math.hypot(next.x - position.x, next.z - position.z);
      distance += moved;
      frameTravel = moved / Math.max(perspective, 0.45);
      walking = moved > 0.0001;
      position = next;
      if (walking) heading = Math.atan2(dx, dz);
      if (moved < 0.0001 && route.length && dt > 0) {
        route = [];
        destination = null;
      }
    }
    if (!paused && portalCooldown <= 0)
      for (const portal of WORLDS[region].portals) {
        const point = WORLDS[region].nodes.find((n) => n.id === portal.node)!;
        if (Math.hypot(position.x - point.x, position.z - point.z) < 1.6) {
          switchRegion(portal.to, portal.spawn);
          break;
        }
      }
    const scale = THREE.MathUtils.clamp((position.z - 15) / 70, 0.45, 1);
    child.scale.setScalar(scale * 1.65);
    character.update(
      paused ? 0 : dt,
      jump.height > 0 ? frameTravel * 0.2 : frameTravel,
      heading,
      walking,
      running,
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
    const maxX = Math.max(0, 60 - halfWidth),
      maxY = Math.max(0, 40 - halfHeight);
    const cameraX = THREE.MathUtils.clamp(child.position.x * (halfWidth < 35 ? 1 : 0), -maxX, maxX);
    const cameraY = THREE.MathUtils.clamp(Math.min(0, child.position.y + halfHeight - 7), -maxY, maxY);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraX, reducedMotion ? 100 : 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraY, reducedMotion ? 100 : 3, dt);
    // Constrain by the character's head/feet, not only its ground position.
    // The old lower-edge-only camera could crop the hood on narrow screens.
    const visibleHalfHeight = halfHeight * 0.98;
    const visibleHalfWidth = halfWidth * 0.98;
    const characterHeight = 10.4 * scale * 1.65;
    const characterHalfWidth = 3.25 * scale * 1.65;
    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x,
      child.position.x + characterHalfWidth - visibleHalfWidth,
      child.position.x - characterHalfWidth + visibleHalfWidth,
    );
    camera.position.y = THREE.MathUtils.clamp(
      camera.position.y,
      child.position.y + characterHeight - visibleHalfHeight,
      child.position.y - 1 + visibleHalfHeight,
    );
    markers.forEach((marker, i) => {
      const point = LANDMARKS[i]!;
      marker.visible = point.region === region;
      marker.position.y = 40 - point.z * 0.8 + 2 + (reducedMotion ? 0 : Math.sin(elapsed * 1.5 + i) * 0.17);
    });
    exitSigns.forEach((sign) => {
      sign.sprite.visible = sign.region === region;
    });
    targetMarker.visible = route.length > 0;
    if (route.length) {
      const target = route[route.length - 1]!;
      targetMarker.position.set(target.x * 1.2 - 60, 40 - target.z * 0.8 + 0.5, 1);
    }
    warmth = THREE.MathUtils.damp(warmth, evening ? 1 : 0, 2, dt);
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
    if (elapsed - statusTime > 0.12) {
      container.dataset.motion = jump.height > 0 ? 'jumping' : walking ? (running ? 'running' : 'walking') : 'idle';
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
  return {
    setEvening(value) {
      evening = value;
    },
    setInput(key, pressed) {
      if (key === 'shift') {
        touchSprint = pressed;
        return;
      }
      if (key === ' ') {
        if (pressed && !document.querySelector('dialog[open]')) startJump(jump);
        return;
      }
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
      plan();
    },
    reset() {
      destination = null;
      switchRegion('village', SPAWN);
      keys.clear();
    },
    photo() {
      renderer.render(scene, camera);
      const canvas = document.createElement('canvas');
      canvas.width = renderer.domElement.width;
      canvas.height = renderer.domElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(renderer.domElement, 0, 0);
      ctx.fillStyle = '#fff9e8';
      ctx.font = `${Math.max(20, canvas.width / 55)}px serif`;
      ctx.shadowColor = '#18372c';
      ctx.shadowBlur = 5;
      ctx.fillText('木漏れ日  /  여름빛 산책', canvas.width * 0.04, canvas.height * 0.95);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `komorebi-${region}-${Date.now()}.png`;
        a.href = url;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      renderer.domElement.removeEventListener('pointerdown', click);
      geo.dispose();
      dustGeo.dispose();
      [background, shadowMat, dustMat, targetMat, ...markerMats, ...exitMaterials].forEach((m) => m.dispose());
      loaded.forEach((t) => t.dispose());
      character.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
