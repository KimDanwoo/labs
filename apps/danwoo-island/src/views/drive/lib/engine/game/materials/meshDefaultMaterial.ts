import { color, float, Fn, frontFacing, If, max, mix, normalWorld, positionWorld, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { getGame } from '@views/drive/lib/engine/game/gameContext';

type ColorNode = THREE.Node<'vec3'>;
type FloatNode = THREE.Node<'float'>;

export interface MeshDefaultMaterialOptions {
  depthWrite?: boolean;
  depthTest?: boolean;
  side?: THREE.Side;
  shadowSide?: THREE.Side;
  wireframe?: boolean;
  transparent?: boolean;
  alphaTest?: number;
  hasCoreShadows?: boolean;
  hasDropShadows?: boolean;
  hasLightBounce?: boolean;
  hasFog?: boolean;
  hasWater?: boolean;
  hasReveal?: boolean;
  colorNode?: ColorNode;
  normalNode?: THREE.Node<'vec3'>;
  alphaNode?: FloatNode;
  shadowNode?: FloatNode;
}

interface Features {
  hasCoreShadows: boolean;
  hasDropShadows: boolean;
  hasLightBounce: boolean;
  hasFog: boolean;
  hasWater: boolean;
  hasReveal: boolean;
}

const DEFAULT_ALPHA_TEST = 0.1;
const DOWN = vec3(0, -1, 0);
const WATERLINE_COLOR = '#ffffff';

export function revealNode(outputColor: ColorNode): ColorNode {
  const { reveal } = getGame();
  return Fn(([base]: [ColorNode]): ColorNode => {
    const distanceToCenter = positionWorld.xz.sub(reveal.position2Uniform).length();
    distanceToCenter.greaterThan(reveal.distance).discard();

    const revealMix = distanceToCenter.step(reveal.distance.sub(reveal.thickness));
    const revealColor = reveal.color.mul(reveal.intensity);
    return mix(base.rgb, revealColor, revealMix);
  })(outputColor);
}

function isTwoSided(side: THREE.Side): boolean {
  return side === THREE.DoubleSide || side === THREE.BackSide;
}

function resolveFeatures(options: MeshDefaultMaterialOptions): Features {
  return {
    hasCoreShadows: options.hasCoreShadows ?? true,
    hasDropShadows: options.hasDropShadows ?? true,
    hasLightBounce: options.hasLightBounce ?? true,
    hasFog: options.hasFog ?? true,
    hasWater: options.hasWater ?? true,
    hasReveal: options.hasReveal ?? true,
  };
}

export class MeshDefaultMaterial extends THREE.MeshLambertNodeMaterial {
  readonly shadedOutput: THREE.Node<'vec4'>;
  readonly #features: Features;
  readonly #colorNode: ColorNode;
  readonly #normalNode: THREE.Node<'vec3'>;
  readonly #alphaNode: FloatNode;
  readonly #shadowNode: FloatNode;
  readonly #catchedShadow = float(1).toVar();

  constructor(options: MeshDefaultMaterialOptions = {}) {
    super();
    this.#applyRenderOptions(options);
    this.#features = resolveFeatures(options);
    this.#colorNode = options.colorNode ?? vec3(1);
    this.#normalNode = options.normalNode ?? normalWorld;
    this.#alphaNode = options.alphaNode ?? float(1);
    this.#shadowNode = options.shadowNode ?? float(0);

    this.normalNode = this.#normalNode;
    if (this.#features.hasDropShadows) this.receivedShadowNode = this.#catchShadow();
    this.shadedOutput = Fn(() => this.#output())();
    this.outputNode = this.shadedOutput;
  }

  #applyRenderOptions(options: MeshDefaultMaterialOptions): void {
    this.depthWrite = options.depthWrite ?? true;
    this.depthTest = options.depthTest ?? true;
    this.side = options.side ?? THREE.FrontSide;
    this.shadowSide = options.shadowSide ?? THREE.FrontSide;
    this.wireframe = options.wireframe ?? false;
    this.transparent = options.transparent ?? false;
    this.alphaTest = options.alphaTest ?? DEFAULT_ALPHA_TEST;
  }

  #catchShadow(): (shadow?: THREE.Node<'vec4'>) => THREE.Node {
    const catchShadow = Fn(([shadow]: [THREE.Node<'vec4'>]): FloatNode => {
      this.#catchedShadow.mulAssign(shadow.r);
      return float(1);
    });
    // @types/three는 인자 없는 함수로 선언하지만 three는 그림자 노드를 넘겨 호출한다 (three/src/nodes/lighting/ShadowNode.js)
    return (shadow) => {
      if (!shadow) throw new Error('receivedShadowNode needs a shadow node');
      return catchShadow(shadow);
    };
  }

  #output(): THREE.Node<'vec4'> {
    const { lighting, fog } = getGame();
    const { hasCoreShadows, hasDropShadows, hasLightBounce, hasFog, hasWater, hasReveal } = this.#features;
    const baseColor = this.#colorNode.toVar();
    const outputColor = this.#colorNode.toVar();
    const normal = this.#orientedNormal();

    if (hasLightBounce) {
      const { bounceColor, bounceMix } = this.#lightBounce(normal);
      outputColor.assign(mix(outputColor, bounceColor, bounceMix));
    }
    if (hasWater) {
      const isAwayFromWaterline = this.#isAwayFromWaterline();
      outputColor.assign(isAwayFromWaterline.select(outputColor, color(WATERLINE_COLOR)));
      baseColor.assign(isAwayFromWaterline.select(baseColor, color(WATERLINE_COLOR)));
    }

    outputColor.mulAssign(lighting.colorUniform.mul(lighting.intensityUniform));

    if (hasCoreShadows || hasDropShadows) {
      const coreShadowMix = hasCoreShadows
        ? normal.dot(lighting.directionUniform).smoothstep(lighting.coreShadowEdgeHigh, lighting.coreShadowEdgeLow)
        : float(0);
      const dropShadowMix = hasDropShadows ? this.#catchedShadow.oneMinus() : float(0);
      const shadowMix = max(coreShadowMix, dropShadowMix, this.#shadowNode).clamp(0, 1);
      const shadowColor = baseColor.rgb.mul(lighting.shadowColor).rgb;
      outputColor.assign(mix(outputColor, shadowColor, shadowMix));
    }

    if (hasFog) outputColor.assign(fog.strength.mix(outputColor, fog.color));

    this.#alphaNode.lessThan(this.alphaTest).discard();

    if (hasReveal) outputColor.assign(revealNode(outputColor));

    return vec4(outputColor, this.#alphaNode);
  }

  #orientedNormal(): THREE.Node<'vec3'> {
    const normal = this.#normalNode.toVar();
    if (isTwoSided(this.side)) {
      If(frontFacing.not(), () => {
        normal.mulAssign(-1);
      });
    }
    return normal;
  }

  #lightBounce(normal: THREE.Node<'vec3'>): { bounceColor: ColorNode; bounceMix: FloatNode } {
    const { lighting, terrain } = getGame();
    const orientation = normal.dot(DOWN).smoothstep(lighting.lightBounceEdgeLow, lighting.lightBounceEdgeHigh);
    const distance = lighting.lightBounceDistance
      .sub(max(0, positionWorld.y))
      .div(lighting.lightBounceDistance)
      .max(0)
      .pow(2);
    const bounceColor = terrain.colorNode(terrain.terrainNode(positionWorld.xz));
    return { bounceColor, bounceMix: orientation.mul(distance).mul(lighting.lightBounceMultiplier) };
  }

  #isAwayFromWaterline(): THREE.Node<'bool'> {
    const { water } = getGame();
    return positionWorld.y.sub(water.surfaceElevationUniform).abs().greaterThan(water.surfaceThicknessUniform);
  }
}
