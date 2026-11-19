import gsap from 'gsap';
import { Fn, max, mix, step, uv, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';
import type { AudioItem } from './audioItem';
import { getGame } from './gameContext';
import type { InteractivePoint } from './interactivePoint';
import type { PointAlign } from './interactivePointArt';
import type { PointState } from './pointProximity';

export interface InteractivePointOptions {
  position: THREE.Vector3;
  text?: string;
  align?: PointAlign;
  state?: PointState;
  onInteract?: () => void;
  onReveal?: () => void;
  onConceal?: () => void;
  onHide?: () => void;
}

export interface SharedParts {
  plane: THREE.PlaneGeometry;
  label: THREE.PlaneGeometry;
  keyIcon: THREE.Mesh;
  playerPosition: THREE.UniformNode<'vec2', THREE.Vector2>;
  backColor: THREE.UniformNode<'color', THREE.Color>;
  frontColor: THREE.UniformNode<'color', THREE.Color>;
  sounds: { reveal: AudioItem; conceal: AudioItem };
}

export interface PointRegistry {
  focus(item: InteractivePoint): void;
  blur(item: InteractivePoint): void;
  release(item: InteractivePoint): void;
  isActive(item: InteractivePoint): boolean;
  requestTest(): void;
  growKeyIcon(): void;
  shrinkKeyIcon(): void;
}
export const CENTER_BIAS_NDC = 0.15;
export const GROUP = { pitch: -Math.PI * 0.15, yaw: Math.PI * 0.25, scale: 0.85 } as const;
export const RENDER_ORDER = { label: 6, diamond: 7 } as const;
export const HIT_RADIUS = 0.75;
export const DIAMOND = {
  hidden: { threshold: 0, thickness: 0.15, offset: 0.175 },
  open: { threshold: 0.5, thickness: 0.075, offset: 0.15 },
  concealed: { threshold: 0.25, thickness: 0.15, offset: 0.175 },
} as const;
export function foggedBackColor(shared: SharedParts): THREE.Node<'vec3'> {
  const { fog } = getGame();
  return fog.strength.mix(shared.backColor, fog.color);
}

type FloatUniform = THREE.UniformNode<'float', number>;

export function labelMaterial(
  shared: SharedParts,
  labelMap: THREE.TextureNode,
  labelUv: THREE.Node<'vec2'>,
): THREE.MeshLambertNodeMaterial {
  const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: true });
  material.outputNode = Fn(() => {
    labelUv.x.greaterThan(1).discard();
    labelUv.x.lessThan(0).discard();
    return vec4(vec3(mix(foggedBackColor(shared), shared.frontColor, labelMap.r)), labelMap.g);
  })();
  return material;
}

export function diamondMaterial(
  shared: SharedParts,
  {
    threshold,
    lineOffset,
    lineThickness,
  }: { threshold: FloatUniform; lineOffset: FloatUniform; lineThickness: FloatUniform },
): THREE.MeshLambertNodeMaterial {
  const material = new THREE.MeshLambertNodeMaterial({ transparent: true, depthTest: true });
  material.outputNode = Fn(() => {
    const pointUv = uv();
    const distance = max(pointUv.x.sub(0.5).abs(), pointUv.y.sub(0.5).abs()).mul(2);
    const lineDistance = threshold.sub(distance).sub(lineOffset).abs();
    const line = step(lineDistance, lineThickness.mul(0.5));
    distance.greaterThan(threshold).discard();
    return vec4(vec3(mix(foggedBackColor(shared), shared.frontColor, line)), 1);
  })();
  return material;
}

export function pulseThreshold(threshold: FloatUniform): void {
  gsap.to(threshold, {
    value: 0.6,
    ease: 'power2.out',
    duration: 0.1,
    overwrite: true,
    onComplete: () => {
      gsap.to(threshold, {
        value: DIAMOND.open.threshold,
        ease: 'elastic.out(1.3,0.6)',
        duration: 1.5,
        overwrite: true,
      });
    },
  });
}

export function placePointGroup(group: THREE.Group, position: THREE.Vector3): void {
  group.rotation.reorder('YXZ');
  group.rotation.x = GROUP.pitch;
  group.rotation.y = GROUP.yaw;
  group.position.copy(position);
  group.scale.setScalar(GROUP.scale);
}

export function setDepthTest(materials: readonly THREE.Material[], isDepthTested: boolean): void {
  for (const material of materials) {
    material.depthTest = isDepthTested;
    material.needsUpdate = true;
  }
}

export function tweenDiamond(
  {
    threshold,
    lineThickness,
    lineOffset,
  }: { threshold: FloatUniform; lineThickness: FloatUniform; lineOffset: FloatUniform },
  target: (typeof DIAMOND)[PointState],
  vars: gsap.TweenVars,
  onComplete?: () => void,
): void {
  gsap.to(threshold, { value: target.threshold, ...vars, overwrite: true });
  gsap.to(lineThickness, { value: target.thickness, ...vars, overwrite: true });
  gsap.to(lineOffset, { value: target.offset, ...vars, overwrite: true, onComplete });
}
