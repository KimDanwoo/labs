import { hashBlur } from 'three/addons/tsl/display/hashBlur.js';
import {
  color,
  float,
  Fn,
  hash,
  max,
  positionWorld,
  screenUV,
  select,
  texture,
  uniform,
  vec3,
  vec4,
  viewportSharedTexture,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import type { WorldObject } from '../objects';
import type { Physical } from '../physics/physics';
import { QUALITY, type QualityLevel } from '../quality';
import { lerp, remapClamp } from '../utilities/maths';

type Vec4Node = THREE.Node<'vec4'>;

interface Details {
  hasRipples: boolean;
  hasIce: boolean;
  hasSplashes: boolean;
}

const ICE_HALF_THICKNESS = 0.5;
const ICE_HALF_EXTENT = 256;
const ICE_FRICTION = { melted: 0.5, frozen: 0.02 } as const;
const ICE_HIDDEN_DEPTH = -1.5;
const MIN_RATIO = 0.0001;
const BLUR = { amount: 0.01, repeats: 25 } as const;
const TICK_ORDER = 10;
const THROTTLE_ORDER = 2;

export class WaterSurface {
  readonly ice: WorldObject & { physical: Physical; halfThickness: number };
  readonly iceRatio = uniform(0);
  readonly #ripplesRatio = uniform(1);
  readonly #splashesRatio = uniform(0);
  readonly #details: Details = { hasRipples: false, hasIce: false, hasSplashes: false };
  readonly #mesh: THREE.Mesh;
  #material: MeshDefaultMaterial;
  #blurredOutput: THREE.Node | null = null;

  constructor() {
    const game = getGame();
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    geometry.rotateX(-Math.PI * 0.5);
    this.#material = this.#createMaterial();

    this.#mesh = new THREE.Mesh(geometry, this.#material);
    this.#mesh.scale.setScalar(game.view.optimalArea.radius * 2);
    this.#mesh.position.y = game.water.surfaceElevation;
    this.#mesh.castShadow = true;
    this.#mesh.receiveShadow = true;
    game.scene.children.unshift(this.#mesh);
    game.viewport.events.on(
      'throttleChange',
      () => this.#mesh.scale.setScalar(game.view.optimalArea.radius * 2),
      THROTTLE_ORDER,
    );

    this.ice = { ...this.#createIce(), halfThickness: ICE_HALF_THICKNESS };
    game.quality.events.on('change', (level) => this.#applyQuality(level));
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER);
  }

  #createIce(): WorldObject & { physical: Physical } {
    const game = getGame();
    const physical = game.physics.getPhysical({
      type: 'kinematicPositionBased',
      position: new THREE.Vector3(0, game.water.surfaceElevation - ICE_HALF_THICKNESS, 0),
      frictionRule: 'min',
      friction: 0.02,
      enabled: false,
      colliders: [{ shape: 'cuboid', parameters: [ICE_HALF_EXTENT, ICE_HALF_THICKNESS, ICE_HALF_EXTENT] }],
    });
    return { visual: null, physical, needsUpdate: false, isResetting: false };
  }

  #ripplesNode(terrainData: Vec4Node): THREE.Node<'float'> {
    const { wind, noises } = getGame();
    const slopeFrequency = uniform(10);
    const noiseFrequency = uniform(0.1);
    const noiseOffset = uniform(0.345);
    const rippleIndex = terrainData.b.add(wind.localTime.mul(0.5)).mul(slopeFrequency).floor();
    const ripplesNoise = texture(
      noises.perlin,
      positionWorld.xz.add(rippleIndex.div(noiseOffset)).mul(noiseFrequency),
    ).r;
    const ripples = terrainData.b
      .add(wind.localTime.mul(0.5))
      .mul(slopeFrequency)
      .mod(1)
      .sub(terrainData.b.remap(0, 1, -0.3, 1).oneMinus())
      .add(ripplesNoise);
    ripples.assign(this.#ripplesRatio.remap(0, 1, -1, -0.4).step(ripples));
    return ripples;
  }

  #iceNode(terrainData: Vec4Node): THREE.Node<'float'> {
    const iceVoronoi = texture(getGame().noises.voronoi, positionWorld.xz.mul(uniform(0.3))).g;
    const ice = terrainData.b.remapClamp(0, this.iceRatio, 0, 1).toVar();
    ice.assign(iceVoronoi.step(ice));
    return ice;
  }

  #splashesNode(): THREE.Node<'float'> {
    const { noises, wind } = getGame();
    const noiseFrequency = uniform(0.33);
    const voronoi = texture(noises.voronoi, positionWorld.xz.mul(noiseFrequency));
    const perlin = texture(noises.perlin, positionWorld.xz.mul(noiseFrequency.mul(0.25))).r;
    const splash = voronoi.r;
    const splashTime = wind.localTime.mul(uniform(6)).add(hash(voronoi.b.mul(123456)).add(perlin));
    splash.assign(splash.sub(splashTime).mod(1));
    const edgeMultiplier = voronoi.g.remapClamp(uniform(0.14), uniform(1), 0, 1);
    splash.assign(splash.step(uniform(0.3).mul(edgeMultiplier)).oneMinus());
    const visible = hash(voronoi.b.mul(654321)).add(perlin).mod(1);
    visible.assign(this.#splashesRatio.step(visible));
    splash.assign(splash.mul(visible));
    return splash;
  }

  #detailsMask(): THREE.Node<'float'> {
    const { terrain } = getGame();
    const shoreEdge = uniform(0.17);
    return Fn(() => {
      const terrainData = terrain.terrainNode(positionWorld.xz);
      const value = float(0);
      if (this.#details.hasRipples) value.assign(max(value, this.#ripplesNode(terrainData)));
      if (this.#details.hasIce) value.assign(max(value, this.#iceNode(terrainData)));
      if (this.#details.hasSplashes) value.assign(max(value, this.#splashesNode()));
      value.assign(max(value, shoreEdge.step(terrainData.b)));
      return value;
    })();
  }

  #createMaterial(): MeshDefaultMaterial {
    const material = new MeshDefaultMaterial({
      depthWrite: false,
      colorNode: color(0xffffff).rgb,
      alphaNode: this.#detailsMask(),
      alphaTest: 0,
      hasCoreShadows: false,
      hasDropShadows: true,
      hasLightBounce: false,
      hasFog: true,
      hasWater: false,
      transparent: true,
    });
    const baseOutput = material.shadedOutput;
    this.#blurredOutput = Fn(() => {
      const blurred = vec3(
        hashBlur(viewportSharedTexture(screenUV), BLUR.amount, { repeats: BLUR.repeats, premultipliedAlpha: true }),
      );
      return select(baseOutput.a.lessThan(0.5), blurred, vec4(baseOutput.rgb, 1));
    })();
    material.maskShadowNode = this.#detailsMask().greaterThan(0.5);
    this.#material = material;
    this.#applyQuality(getGame().quality.level);
    return material;
  }

  #applyQuality(level: QualityLevel): void {
    if (level === QUALITY.high && this.#blurredOutput) this.#material.outputNode = this.#blurredOutput;
    else if (level === QUALITY.low) this.#material.outputNode = this.#material.shadedOutput;
    this.#material.needsUpdate = true;
  }

  #rebuildMaterial(): void {
    const previous = this.#material;
    const material = this.#createMaterial();
    previous.dispose();
    this.#mesh.material = material;
  }

  update(): void {
    const { weather, view, water, objects } = getGame();
    this.#ripplesRatio.value = remapClamp(weather.temperature.value, [0, -3], [1, 0]);
    this.iceRatio.value = remapClamp(weather.temperature.value, [0, -5], [0, 1]);
    this.#splashesRatio.value = weather.rain.value ** 2;

    this.#mesh.position.x = view.optimalArea.position.x;
    this.#mesh.position.z = view.optimalArea.position.z;
    this.#mesh.renderOrder = 1;

    const details: Details = {
      hasRipples: this.#ripplesRatio.value > MIN_RATIO,
      hasIce: this.iceRatio.value > MIN_RATIO,
      hasSplashes: this.#splashesRatio.value > MIN_RATIO,
    };
    const hasChanged =
      details.hasRipples !== this.#details.hasRipples ||
      details.hasIce !== this.#details.hasIce ||
      details.hasSplashes !== this.#details.hasSplashes;
    if (hasChanged) {
      Object.assign(this.#details, details);
      this.#rebuildMaterial();
    }

    const { physical } = this.ice;
    const ratio = this.iceRatio.value;
    physical.body.collider(0).setFriction(lerp(ICE_FRICTION.melted, ICE_FRICTION.frozen, ratio));
    physical.body.setNextKinematicTranslation({
      x: 0,
      y: lerp(ICE_HIDDEN_DEPTH - ICE_HALF_THICKNESS, water.surfaceElevation - ICE_HALF_THICKNESS, ratio),
      z: 0,
    });
    const isEnabled = physical.body.isEnabled();
    if (ratio > 0 && !isEnabled) objects.enable(this.ice);
    else if (ratio <= 0 && isEnabled) objects.disable(this.ice);
  }
}
