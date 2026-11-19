import { color, Fn, luminance, max, mix, step, texture, uniform, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

type LineColor = 'blue' | 'orange' | 'purple' | 'green';
export interface CareerLine {
  readonly index: number;
  readonly size: number;
  readonly hasEnd: boolean;
  readonly stone: THREE.Object3D;
  readonly origin: THREE.Vector3;
  readonly toLocal: THREE.Matrix4;
  readonly labelReveal: THREE.UniformNode<'float', number>;
  isIn: boolean;
  isUp: boolean;
  offsetTarget: number;
}
const LINE_COLORS: Record<LineColor, string> = {
  blue: '#2bb3c0',
  orange: '#ff8a5b',
  purple: '#f6cf68',
  green: '#7cbf5a',
};
const PROFILE_LABELS = new Map<string, readonly [string, string]>([
  ['careerFreelancer', ['김단우', 'FRONTEND ENGINEER']],
  ['careerHetic', ['제품을 키우는', 'PRODUCT']],
  ['careerImmersiveGarden', ['구조부터 다듬는', 'ARCHITECTURE']],
  ['careerIRLTeacher', ['데이터로 판단하는', 'DATA']],
  ['careerOnlineTeacher', ['AI와 함께 만드는', 'WITH AI']],
  ['careerUzik', ['아이디어를 배포하는', 'OPEN RESUME']],
]);
const DEFAULT_LABEL = ['김단우', 'OPEN RESUME'] as const;
export const ACTIVE_ELEVATION = 2.5;
export const PADDING = 0.25;
export const SINK_DELAY = 0.3;
export const EASING = { elevation: 3, offset: 10 } as const;
export const RAISED_THRESHOLD = 1;
export const RESUME_ELEVATION = 1;
const EMISSIVE_STRENGTH = 1.7;
const MASK_COLOR = '#251f2b';
export const LINE_AXIS = new THREE.Vector3(0, 0, 1);
export function worldToLocalMatrix(object: THREE.Object3D): THREE.Matrix4 {
  object.updateMatrixWorld(true);
  return object.matrixWorld.clone().invert();
}
export function isLineColor(value: unknown): value is LineColor {
  return typeof value === 'string' && value in LINE_COLORS;
}
export function profileTexture(name: unknown): THREE.CanvasTexture {
  const [title, subtitle] = (typeof name === 'string' ? PROFILE_LABELS.get(name) : undefined) ?? DEFAULT_LABEL;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.fillStyle = '#000000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ff0000';
  context.font = '700 70px MaruBuri';
  context.fillText(title, 512, 84, 960);
  context.fillStyle = '#00ff00';
  context.font = '700 38px MaruBuri';
  context.fillText(subtitle, 512, 176, 960);
  const map = new THREE.CanvasTexture(canvas);
  map.flipY = false;
  map.minFilter = THREE.LinearFilter;
  return map;
}
export function labelMaterial(
  map: THREE.Texture,
  lineColor: LineColor,
  reveal: CareerLine['labelReveal'],
): THREE.MeshLambertNodeMaterial {
  const baseColor = uniform(color(LINE_COLORS[lineColor]));
  const material = new THREE.MeshLambertNodeMaterial({ transparent: true });
  material.outputNode = Fn(() => {
    const baseUv = uv().toVar();
    step(baseUv.x, reveal).lessThan(0.5).discard();
    const textureColor = texture(map, baseUv);
    const alpha = step(0.1, max(textureColor.r, textureColor.g));
    const emissiveColor = baseColor.div(luminance(baseColor)).mul(EMISSIVE_STRENGTH);
    return vec4(mix(color(MASK_COLOR), emissiveColor, textureColor.r), alpha);
  })();
  return material;
}
