import { hashBlur } from 'three/addons/tsl/display/hashBlur.js';
import {
  color,
  float,
  Fn,
  max,
  modelWorldMatrix,
  positionLocal,
  positionWorld,
  screenUV,
  select,
  uniform,
  vec3,
  vec4,
  viewportSharedTexture,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';
import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import type { ColliderDescription, Physical } from '@views/drive/lib/engine/game/physics/physicsTypes';
import { READS_FRAMEBUFFER } from '@views/drive/lib/engine/game/preRenderer';
import { QUALITY, type QualityLevel } from '@views/drive/lib/engine/game/quality';
import { TICK_ORDER } from '@views/drive/lib/engine/game/tickOrder';
import { lerp, remapClamp } from '@views/drive/lib/engine/game/utilities/maths';
import {
  BLUR,
  type Details,
  ICE_FRICTION,
  ICE_HALF_EXTENT,
  ICE_HALF_THICKNESS,
  ICE_HIDDEN_DEPTH,
  MIN_RATIO,
  THROTTLE_ORDER,
} from '@views/drive/lib/engine/game/world/waterSurfaceConfig';
import { iceNode, ripplesNode, splashesNode } from '@views/drive/lib/engine/game/world/waterSurfaceNodes';

import { COVE } from '@views/drive/lib/engine/game/world/layout/tideCove';

function iceTile(left: number, right: number, top: number, bottom: number): ColliderDescription {
  return {
    shape: 'cuboid',
    position: { x: (left + right) / 2, y: 0, z: (top + bottom) / 2 },
    parameters: [(right - left) / 2, ICE_HALF_THICKNESS, (bottom - top) / 2],
  };
}

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
    const geometry = new THREE.PlaneGeometry(1, 1, 96, 96);
    geometry.rotateX(-Math.PI * 0.5);
    this.#material = this.#createMaterial();

    this.#mesh = new THREE.Mesh(geometry, this.#material);
    this.#mesh.scale.set(game.view.optimalArea.radius * 2, 1, game.view.optimalArea.radius * 2);
    this.#mesh.position.y = game.water.surfaceElevation;
    this.#mesh.castShadow = true;
    this.#mesh.receiveShadow = true;
    this.#mesh.userData[READS_FRAMEBUFFER] = true;
    game.scene.children.unshift(this.#mesh);
    game.viewport.events.on(
      'throttleChange',
      () => this.#mesh.scale.set(game.view.optimalArea.radius * 2, 1, game.view.optimalArea.radius * 2),
      THROTTLE_ORDER,
    );

    this.ice = { ...this.#createIce(), halfThickness: ICE_HALF_THICKNESS };
    game.quality.events.on('change', (level) => this.#applyQuality(level));
    game.ticker.events.on('tick', () => this.update(), TICK_ORDER.waterSurface);
  }

  #createIce(): WorldObject & { physical: Physical } {
    const game = getGame();
    const physical = game.physics.getPhysical({
      type: 'kinematicPositionBased',
      position: new THREE.Vector3(0, game.water.surfaceElevation - ICE_HALF_THICKNESS, 0),
      frictionRule: 'min',
      friction: 0.02,
      enabled: false,
      colliders: [
        iceTile(COVE.x - COVE.rx, COVE.x + COVE.rx, COVE.z - COVE.rz, COVE.z + COVE.rz),
        iceTile(-ICE_HALF_EXTENT, ICE_HALF_EXTENT, -ICE_HALF_EXTENT, COVE.z - COVE.rz),
        iceTile(-ICE_HALF_EXTENT, ICE_HALF_EXTENT, COVE.z + COVE.rz, ICE_HALF_EXTENT),
        iceTile(-ICE_HALF_EXTENT, COVE.x - COVE.rx, COVE.z - COVE.rz, COVE.z + COVE.rz),
        iceTile(COVE.x + COVE.rx, ICE_HALF_EXTENT, COVE.z - COVE.rz, COVE.z + COVE.rz),
      ],
    });
    return { visual: null, physical, needsUpdate: false, isResetting: false };
  }

  #detailsMask(): THREE.Node<'float'> {
    const { terrain } = getGame();
    const shoreEdge = uniform(0.17);
    return Fn(() => {
      const terrainData = terrain.terrainNode(positionWorld.xz);
      const value = float(0);
      if (this.#details.hasRipples) value.assign(max(value, ripplesNode(terrainData, this.#ripplesRatio)));
      if (this.#details.hasIce) value.assign(max(value, iceNode(terrainData, this.iceRatio)));
      if (this.#details.hasSplashes) value.assign(max(value, splashesNode(this.#splashesRatio)));
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
    const localDrop = getGame().water.dropNode(modelWorldMatrix.mul(vec4(positionLocal, 1)).xz);
    material.positionNode = positionLocal.sub(vec3(0, localDrop, 0));
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
    const shouldBlurWater = level === QUALITY.high && this.#blurredOutput;
    if (shouldBlurWater) this.#material.outputNode = this.#blurredOutput;
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
    water.advance(getGame().ticker.deltaScaled);
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
    if (ratio > 0) {
      physical.body.collider(0).setTranslationWrtParent({ x: COVE.x, y: -water.tide.value * COVE.drop, z: COVE.z });
      for (const collider of physical.colliders)
        collider.setFriction(lerp(ICE_FRICTION.melted, ICE_FRICTION.frozen, ratio));
    }
    physical.body.setNextKinematicTranslation({
      x: 0,
      y: lerp(ICE_HIDDEN_DEPTH - ICE_HALF_THICKNESS, water.surfaceElevation - ICE_HALF_THICKNESS, ratio),
      z: 0,
    });
    const isEnabled = physical.body.isEnabled();
    const shouldEnableIce = ratio > 0 && !isEnabled;
    const shouldDisableIce = ratio <= 0 && isEnabled;
    if (shouldEnableIce) objects.enable(this.ice);
    else if (shouldDisableIce) objects.disable(this.ice);
  }
}
