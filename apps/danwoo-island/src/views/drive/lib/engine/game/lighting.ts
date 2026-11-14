import { color, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from './gameContext';
import { QUALITY, type QualityLevel } from './quality';

const SUN = { phi: 0.63, theta: 0.72, phiAmplitude: 0.62, thetaAmplitude: 1.25, cycleOffset: 9 / 16 } as const;
const SHADOW = { near: 1, bias: -0.001, normalBias: 0.1 } as const;
const SHADOW_MAP_SIZE = { [QUALITY.high]: 2048, [QUALITY.low]: 512 } satisfies Record<QualityLevel, number>;
const SHADOW_RADIUS = { [QUALITY.high]: 3, [QUALITY.low]: 2 } satisfies Record<QualityLevel, number>;
const LIGHT_INTENSITY = 5;
const TICK_ORDER = 9;
const THROTTLED_RESIZE_ORDER = 3;

export class Lighting {
  readonly game = getGame();
  readonly spherical: THREE.Spherical;
  readonly direction = new THREE.Vector3();
  readonly directionUniform = uniform(this.direction);
  readonly colorUniform = uniform(color('#ffffff'));
  readonly intensityUniform = uniform(1);
  readonly lightBounceEdgeLow = uniform(-1);
  readonly lightBounceEdgeHigh = uniform(1);
  readonly lightBounceDistance = uniform(1.5);
  readonly lightBounceMultiplier = uniform(1);
  readonly shadowColor = uniform(this.game.dayCycles.colorOf('shadowColor'));
  readonly coreShadowEdgeLow = uniform(-0.25);
  readonly coreShadowEdgeHigh = uniform(1);
  readonly light = new THREE.DirectionalLight(0xffffff, LIGHT_INTENSITY);

  constructor() {
    const { radius } = this.game.view.optimalArea;
    this.spherical = new THREE.Spherical(radius + SHADOW.near, SUN.phi, SUN.theta);
    this.direction.setFromSpherical(this.spherical).normalize();
    this.light.position.setFromSpherical(this.spherical);
    this.light.castShadow = true;
    this.game.scene.add(this.light, this.light.target);
    this.#fitShadow(radius);
    this.#applyQuality(this.game.quality.level);

    this.game.quality.events.on('change', (level) => this.#applyQuality(level));
    this.game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
    this.game.viewport.events.on(
      'throttleChange',
      () => {
        this.spherical.radius = this.game.view.optimalArea.radius;
        this.#fitShadow(this.game.view.optimalArea.radius);
      },
      THROTTLED_RESIZE_ORDER,
    );
  }

  update(): void {
    const angle = -(this.game.dayCycles.progress + SUN.cycleOffset) * Math.PI * 2;
    this.spherical.theta = SUN.theta + Math.sin(angle) * SUN.thetaAmplitude;
    this.spherical.phi = SUN.phi + Math.cos(angle) * 0.5 * SUN.phiAmplitude;
    this.direction.setFromSpherical(this.spherical).normalize();

    const center = this.game.view.optimalArea.position;
    this.light.position.setFromSpherical(this.spherical).add(center);
    this.light.target.position.copy(center);
    this.colorUniform.value.copy(this.game.dayCycles.colorOf('lightColor'));
    this.intensityUniform.value = this.game.dayCycles.numberOf('lightIntensity');
  }

  #fitShadow(amplitude: number): void {
    const { shadow } = this.light;
    Object.assign(shadow.camera, {
      top: amplitude,
      right: amplitude,
      bottom: -amplitude,
      left: -amplitude,
      near: SHADOW.near,
      far: SHADOW.near + amplitude * 2,
    });
    shadow.bias = SHADOW.bias;
    shadow.normalBias = SHADOW.normalBias;
    shadow.camera.updateProjectionMatrix();
  }

  #applyQuality(level: QualityLevel): void {
    this.light.shadow.mapSize.set(SHADOW_MAP_SIZE[level], SHADOW_MAP_SIZE[level]);
    this.light.shadow.radius = SHADOW_RADIUS[level];
  }
}
