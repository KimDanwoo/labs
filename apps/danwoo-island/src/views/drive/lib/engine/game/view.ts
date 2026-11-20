import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { introCenter } from '@views/drive/lib/engine/game/introCenter';
import { QUALITY } from '@views/drive/lib/engine/game/quality';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { lerp, smoothstep } from '@views/drive/lib/engine/game/utilities/maths';
import { prefersReducedMotion } from '@views/drive/lib/engine/game/utilities/reducedMotion';
import { CameraRoll } from '@views/drive/lib/engine/game/view/cameraRoll';
import { Cinematic } from '@views/drive/lib/engine/game/view/cinematic';
import { OptimalArea } from '@views/drive/lib/engine/game/view/optimalArea';
import { frameOverview, type OverviewFrame, type ScreenInsets } from '@views/drive/lib/engine/game/view/overviewFrame';
import { SpeedLines } from '@views/drive/lib/engine/game/view/speedLines';
import {
  CAMERA,
  FOCUS,
  IDEAL_RATIO,
  OVERVIEW,
  SPHERICAL,
  THROTTLED_RESIZE_ORDER,
  ZOOM,
  type FocusPoint,
  type Spherical,
  type Zoom,
} from '@views/drive/lib/engine/game/view/viewConfig';
import {
  createSpherical,
  followTarget,
  listenFocusActions,
  listenMapDrag,
  listenZoom,
  nudgeZoom,
  panWithGamepad,
  smoothFocus,
} from '@views/drive/lib/engine/game/view/viewControls';

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
  readonly overview: { amount: number; radius: number } = { amount: 0, radius: OVERVIEW.radius };
  #isOverviewWide = false;

  constructor() {
    this.#updateRatioOverflow();
    const center = introCenter(this.game.respawns);
    this.focusPoint = {
      trackedPosition: center.clone(),
      isTracking: false,
      position: center.clone(),
      smoothedPosition: center.clone(),
      easing: 1,
      magnet: { active: false, multiplier: FOCUS.magnetMultiplier },
    };
    this.spherical = createSpherical(
      Math.PI * SPHERICAL.phiByQuality[this.game.quality.level],
      this.zoom.smoothedRatio,
    );

    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, this.game.viewport.ratio, CAMERA.near, CAMERA.far);
    this.camera.position.copy(this.spherical.offset);
    this.defaultCamera = this.camera.clone();
    this.game.scene.add(this.camera, this.defaultCamera);
    this.cinematic = new Cinematic(this.camera, () => this.ratioOverflow);
    this.speedLines = new SpeedLines(this.game.ticker.elapsedScaledUniform);
    this.game.scene.add(this.speedLines.mesh);

    listenFocusActions(this);
    listenZoom(this);
    listenMapDrag(this);
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER.view);
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
    panWithGamepad(this, delta);
    followTarget(this.focusPoint, delta);
    const focusSpeed = smoothFocus(this.focusPoint, delta);
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

  enterOverview(radius: number): void {
    this.overview.radius = radius;
    this.#isOverviewWide = true;
    this.game.viewport.events.trigger('throttleChange');
  }

  leaveOverview(): void {
    if (!this.#isOverviewWide) return;
    this.#isOverviewWide = false;
    this.game.viewport.events.trigger('throttleChange');
  }

  frameOverview(points: readonly THREE.Vector3[], insets: ScreenInsets): OverviewFrame {
    const { width, height } = this.game.viewport;
    return frameOverview({
      points,
      phi: OVERVIEW.phi,
      theta: this.spherical.theta,
      fov: CAMERA.fov,
      width,
      height,
      insets,
    });
  }

  #maxRadius(): number {
    return SPHERICAL.radius.max + this.ratioOverflow * SPHERICAL.nonIdealRatioOffset;
  }

  #updateZoom(focusSpeed: number, delta: number): void {
    if (this.zoom.toggle !== 0) nudgeZoom(this.zoom, this.zoom.toggle * ZOOM.toggleStep);
    const speedRatio = smoothstep(focusSpeed, ZOOM.speedEdge.min, ZOOM.speedEdge.max);
    const isSpeedZoom =
      this.focusPoint.isTracking && this.game.quality.level === QUALITY.high && !prefersReducedMotion();
    this.zoom.ratio = this.zoom.baseRatio + (isSpeedZoom ? ZOOM.speedAmplitude * speedRatio : 0);
    this.zoom.smoothedRatio = lerp(this.zoom.smoothedRatio, this.zoom.ratio, delta * ZOOM.smoothing);
  }

  #placeCamera(): void {
    const { spherical, defaultCamera, focusPoint } = this;
    const driveRadius = lerp(SPHERICAL.radius.min, this.#maxRadius(), 1 - this.zoom.smoothedRatio);
    const { amount } = this.overview;
    spherical.radius.current = lerp(driveRadius, this.overview.radius, amount);
    const phi = lerp(spherical.phi, OVERVIEW.phi, amount);
    spherical.offset.setFromSphericalCoords(spherical.radius.current, phi, spherical.theta);
    this.#applyClipping(amount);
    this.position.copy(focusPoint.smoothedPosition).add(spherical.offset);
    this.delta = this.position.clone().sub(defaultCamera.position);
    defaultCamera.position.copy(this.position);
    defaultCamera.rotation.set(0, 0, 0);
    defaultCamera.lookAt(focusPoint.smoothedPosition);
    defaultCamera.rotation.z += this.roll.advance(this.game.ticker.deltaScaled);
  }

  #applyClipping(amount: number): void {
    const near = lerp(CAMERA.near, this.overview.radius * OVERVIEW.nearRatio, amount);
    const far = lerp(CAMERA.far, this.overview.radius * OVERVIEW.farRatio, amount);
    if (this.defaultCamera.near === near && this.defaultCamera.far === far) return;
    for (const camera of [this.camera, this.defaultCamera]) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  }

  #measureOptimalArea(): void {
    const camera = this.defaultCamera;
    const savedPosition = camera.position.clone();
    const savedQuaternion = camera.quaternion.clone();
    const speedZoom = this.game.quality.level === QUALITY.high ? 1 - ZOOM.speedAmplitude : 1;
    const radius = this.#isOverviewWide ? this.overview.radius : this.#maxRadius() * speedZoom;
    const phi = this.#isOverviewWide ? OVERVIEW.phi : this.spherical.phi;
    camera.position.setFromSphericalCoords(radius, phi, this.spherical.theta);
    camera.lookAt(new THREE.Vector3());
    camera.updateProjectionMatrix();
    camera.updateWorldMatrix(false, false);
    this.optimalArea.measure(camera);
    camera.position.copy(savedPosition);
    camera.quaternion.copy(savedQuaternion);
  }
}
