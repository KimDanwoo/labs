import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import type { Action } from './inputs/inputs';
import { Pointer } from './inputs/pointer';
import { QUALITY } from './quality';
import { clamp, lerp, remap, smoothstep } from './utilities/maths';
import { CameraRoll } from './view/cameraRoll';
import { Cinematic } from './view/cinematic';
import { OptimalArea } from './view/optimalArea';
import { SpeedLines } from './view/speedLines';

const IDEAL_RATIO = 1920 / 1080;
const CAMERA = { fov: 25, near: 0.1, far: 200 } as const;
const TICK_ORDER = 7;
const THROTTLED_RESIZE_ORDER = 1;
const FOCUS_ACTIONS = new Set([
  'forward',
  'right',
  'backward',
  'left',
  'boost',
  'brake',
  'respawn',
  'suspensions',
  'suspensionsFront',
  'suspensionsBack',
  'suspensionsRight',
  'suspensionsLeft',
  'suspensionsFrontLeft',
  'suspensionsFrontRight',
  'suspensionsBackRight',
  'suspensionsBackLeft',
  'interact',
  'whisper',
]);
const ZOOM = {
  base: 0.6,
  speedAmplitude: -0.4,
  speedEdge: { min: 5, max: 40 },
  wheelSensitivity: 0.05,
  pinchSensitivity: 0.005,
  toggleStep: 0.01,
  smoothing: 10,
} as const;
const SPHERICAL = {
  phiByQuality: { [QUALITY.high]: 0.31, [QUALITY.low]: 0.27 },
  theta: Math.PI * 0.25,
  radius: { min: 15, max: 30 },
  nonIdealRatioOffset: 9,
} as const;
const FOCUS = { magnetMultiplier: 0.25, easingSpeed: 10 } as const;
const MAP_DRAG = { scale: 10, multiplier: 2, gamepadSpeed: 20 } as const;
const MIN_PAN_TOUCHES = 2;

interface FocusPoint {
  trackedPosition: THREE.Vector3;
  isTracking: boolean;
  position: THREE.Vector3;
  smoothedPosition: THREE.Vector3;
  easing: number;
  magnet: { active: boolean; multiplier: number };
}

interface Zoom {
  baseRatio: number;
  ratio: number;
  smoothedRatio: number;
  toggle: number;
  toggleLast: number;
}

interface Spherical {
  phi: number;
  theta: number;
  radius: { current: number };
  offset: THREE.Vector3;
}

export class View {
  readonly game = getGame();
  readonly position = new THREE.Vector3();
  delta = new THREE.Vector3();
  ratioOverflow = 0;
  readonly focusPoint: FocusPoint;
  readonly zoom: Zoom = { baseRatio: ZOOM.base, ratio: ZOOM.base, smoothedRatio: ZOOM.base, toggle: 0, toggleLast: -1 };
  readonly spherical: Spherical;
  readonly roll = new CameraRoll();
  readonly camera: THREE.PerspectiveCamera;
  readonly defaultCamera: THREE.PerspectiveCamera;
  readonly optimalArea = new OptimalArea();
  readonly cinematic: Cinematic;
  readonly speedLines: SpeedLines;

  constructor() {
    this.#updateRatioOverflow();
    const spawn = this.game.respawns.getDefault().position;
    const tracked = new THREE.Vector3(spawn.x, 0, spawn.z);
    this.focusPoint = {
      trackedPosition: tracked,
      isTracking: true,
      position: tracked.clone(),
      smoothedPosition: tracked.clone(),
      easing: 1,
      magnet: { active: true, multiplier: FOCUS.magnetMultiplier },
    };
    this.spherical = {
      phi: Math.PI * SPHERICAL.phiByQuality[this.game.quality.level],
      theta: SPHERICAL.theta,
      radius: { current: lerp(SPHERICAL.radius.min, SPHERICAL.radius.max, 1 - this.zoom.smoothedRatio) },
      offset: new THREE.Vector3(),
    };
    this.spherical.offset.setFromSphericalCoords(
      this.spherical.radius.current,
      this.spherical.phi,
      this.spherical.theta,
    );

    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, this.game.viewport.ratio, CAMERA.near, CAMERA.far);
    this.camera.position.copy(this.spherical.offset);
    this.defaultCamera = this.camera.clone();
    this.game.scene.add(this.camera, this.defaultCamera);
    this.cinematic = new Cinematic(this.camera, () => this.ratioOverflow);
    this.speedLines = new SpeedLines(this.game.ticker.elapsedScaledUniform);
    this.game.scene.add(this.speedLines.mesh);

    this.#listenFocusActions();
    this.#listenZoom();
    this.#listenMapDrag();
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    this.update();
    this.game.viewport.events.on('change', () => this.resize());
    this.game.viewport.events.on('throttleChange', () => this.#measureOptimalArea(), THROTTLED_RESIZE_ORDER);
  }

  resize(): void {
    this.#updateRatioOverflow();
    const aspect = this.game.viewport.width / this.game.viewport.height;
    for (const camera of [this.camera, this.defaultCamera]) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }

  update(): void {
    const { delta } = this.game.ticker;
    this.#panWithGamepad(delta);
    this.#followTarget(delta);
    const focusSpeed = this.#smoothFocus(delta);
    this.#updateZoom(focusSpeed, delta);
    this.#placeCamera();
    this.cinematic.blendInto(this.defaultCamera);
    this.camera.position.copy(this.defaultCamera.position);
    this.camera.quaternion.copy(this.defaultCamera.quaternion);
    this.camera.updateMatrixWorld();
    this.defaultCamera.updateMatrixWorld();
    if (this.optimalArea.needsUpdate) this.#measureOptimalArea();
    this.optimalArea.follow(this.focusPoint.position, this.focusPoint.smoothedPosition);
    this.speedLines.update(this.camera, delta);
  }

  #updateRatioOverflow(): void {
    this.ratioOverflow = Math.max(1, IDEAL_RATIO / this.game.viewport.ratio) - 1;
  }

  #maxRadius(): number {
    return SPHERICAL.radius.max + this.ratioOverflow * SPHERICAL.nonIdealRatioOffset;
  }

  #listenFocusActions(): void {
    this.game.inputs.events.on('actionStart', (action) => {
      if (FOCUS_ACTIONS.has(action.name)) this.focusPoint.isTracking = true;
    });
  }

  #listenZoom(): void {
    this.game.inputs.addActions([
      { name: 'zoom', categories: ['wandering', 'racing'], keys: ['Wheel.roll'] },
      { name: 'zoomToggle', categories: ['wandering', 'racing'], keys: ['Gamepad.r3'] },
    ]);
    this.game.inputs.events.on('zoom', ({ value }) => {
      if (typeof value === 'number') this.#nudgeZoom(-value * ZOOM.wheelSensitivity);
    });
    this.game.inputs.events.on('zoomToggle', ({ active }) => {
      if (!active) {
        this.zoom.toggle = 0;
        return;
      }
      this.zoom.toggle -= this.zoom.toggleLast;
      this.zoom.toggleLast = this.zoom.toggle;
    });
  }

  #nudgeZoom(amount: number): void {
    this.zoom.baseRatio = clamp(this.zoom.baseRatio + amount, 0, 1);
  }

  #listenMapDrag(): void {
    this.game.inputs.addActions([
      { name: 'viewMapPointer', categories: ['intro', 'wandering'], keys: ['Pointer.any'] },
    ]);
    this.game.inputs.events.on('viewMapPointer', (action) => this.#dragMap(action));
  }

  #dragMap({ active }: Action): void {
    if (!active) return;
    const { pointer } = this.game.inputs;
    const isPanning = pointer.mode === Pointer.MODE_MOUSE || pointer.touches.length >= MIN_PAN_TOUCHES;
    if (isPanning) {
      this.focusPoint.isTracking = false;
      const smallestSide = Math.min(this.game.viewport.width, this.game.viewport.height);
      const movement = new THREE.Vector2(pointer.delta.x, pointer.delta.y)
        .rotateAround(new THREE.Vector2(), -this.spherical.theta)
        .multiplyScalar(MAP_DRAG.scale / smallestSide);
      this.focusPoint.position.x -= movement.x * MAP_DRAG.multiplier;
      this.focusPoint.position.z -= movement.y * MAP_DRAG.multiplier;
    }
    this.#nudgeZoom(pointer.pinch.distanceDelta * ZOOM.pinchSensitivity);
  }

  #panWithGamepad(delta: number): void {
    const { right } = this.game.inputs.gamepad.joysticks;
    if (!right.active || this.cinematic.active) return;
    this.focusPoint.isTracking = false;
    const movement = new THREE.Vector2(right.x, right.y)
      .rotateAround(new THREE.Vector2(), -this.spherical.theta)
      .multiplyScalar(MAP_DRAG.gamepadSpeed * delta);
    this.focusPoint.position.x += movement.x;
    this.focusPoint.position.z += movement.y;
  }

  #followTarget(delta: number): void {
    const { position, trackedPosition, magnet } = this.focusPoint;
    if (this.focusPoint.isTracking) {
      position.x = trackedPosition.x;
      position.z = trackedPosition.z;
    }
    if (!magnet.active) return;
    const dx = trackedPosition.x - position.x;
    const dz = trackedPosition.z - position.z;
    const strength = Math.hypot(dx, dz) * magnet.multiplier;
    position.x += strength * dx * delta;
    position.z += strength * dz * delta;
  }

  #smoothFocus(delta: number): number {
    const { smoothedPosition, position, easing } = this.focusPoint;
    const ratio = remap(easing, [0, 1], [1, delta * FOCUS.easingSpeed]);
    const next = smoothedPosition.clone().lerp(position, ratio);
    const moved = next.clone().sub(smoothedPosition);
    smoothedPosition.copy(next);
    return Math.hypot(moved.x, moved.z) / delta;
  }

  #updateZoom(focusSpeed: number, delta: number): void {
    if (this.zoom.toggle !== 0) this.#nudgeZoom(this.zoom.toggle * ZOOM.toggleStep);
    const speedRatio = smoothstep(focusSpeed, ZOOM.speedEdge.min, ZOOM.speedEdge.max);
    const isSpeedZoom = this.focusPoint.isTracking && this.game.quality.level === QUALITY.high;
    this.zoom.ratio = this.zoom.baseRatio + (isSpeedZoom ? ZOOM.speedAmplitude * speedRatio : 0);
    this.zoom.smoothedRatio = lerp(this.zoom.smoothedRatio, this.zoom.ratio, delta * ZOOM.smoothing);
  }

  #placeCamera(): void {
    const { spherical, defaultCamera, focusPoint } = this;
    spherical.radius.current = lerp(SPHERICAL.radius.min, this.#maxRadius(), 1 - this.zoom.smoothedRatio);
    spherical.offset.setFromSphericalCoords(spherical.radius.current, spherical.phi, spherical.theta);
    this.position.copy(focusPoint.smoothedPosition).add(spherical.offset);
    this.delta = this.position.clone().sub(defaultCamera.position);
    defaultCamera.position.copy(this.position);
    defaultCamera.rotation.set(0, 0, 0);
    defaultCamera.lookAt(focusPoint.smoothedPosition);
    defaultCamera.rotation.z += this.roll.advance(this.game.ticker.deltaScaled);
  }

  #measureOptimalArea(): void {
    const camera = this.defaultCamera;
    const savedPosition = camera.position.clone();
    const savedQuaternion = camera.quaternion.clone();
    const speedZoom = this.game.quality.level === QUALITY.high ? 1 - ZOOM.speedAmplitude : 1;
    camera.position.setFromSphericalCoords(this.#maxRadius() * speedZoom, this.spherical.phi, this.spherical.theta);
    camera.lookAt(new THREE.Vector3());
    camera.updateProjectionMatrix();
    camera.updateWorldMatrix(false, false);
    this.optimalArea.measure(camera);
    camera.position.copy(savedPosition);
    camera.quaternion.copy(savedQuaternion);
  }
}
