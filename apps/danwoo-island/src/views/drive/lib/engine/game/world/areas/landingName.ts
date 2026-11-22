import * as THREE from 'three/webgpu';

import { NAME_GLYPHS } from '@views/drive/lib/engine/game/world/areas/nameGlyphs';
import { islandMaterialByKey, VERTEX_COLOR_KEY } from '@views/drive/lib/engine/game/world/islandMaterials';

type PathCommand =
  | readonly ['M' | 'L', number, number]
  | readonly ['C', number, number, number, number, number, number]
  | readonly ['Z'];

export interface GlyphOutline {
  character: string;
  advance: number;
  path: readonly PathCommand[];
}

interface Syllable {
  character: string;
  geometry: THREE.ExtrudeGeometry;
  size: THREE.Vector3;
}

const LETTERS_PATTERN = /^refLettersPhysicalDynamic/;
const COLLIDER_PATTERN = /^cuboid/;
const SYLLABLE_GAP = 0.18;
const HEIGHT_SCALE = 1.6;
const SPAN_CENTER = 0.4;
const BEVEL = 0.012;
const CURVE_SEGMENTS = 6;
const FACE_COLORS = ['#49BDC5', '#F47F75', '#F4B94F'] as const;
const EDGE_COLOR = '#bb8650';
const YAW_JITTER = [0.09, -0.06, 0.11] as const;
const CAP_GROUP = 0;

function glyphShapes({ path }: GlyphOutline): THREE.Shape[] {
  const shapePath = new THREE.ShapePath();
  for (const command of path) {
    if (command[0] === 'M') shapePath.moveTo(command[1], command[2]);
    if (command[0] === 'L') shapePath.lineTo(command[1], command[2]);
    if (command[0] === 'C')
      shapePath.bezierCurveTo(command[1], command[2], command[3], command[4], command[5], command[6]);
  }
  return shapePath.toShapes();
}

function syllableGeometry(glyph: GlyphOutline, height: number, depth: number): Syllable {
  const geometry = new THREE.ExtrudeGeometry(glyphShapes(glyph), {
    depth: 1,
    steps: 1,
    curveSegments: CURVE_SEGMENTS,
    bevelEnabled: true,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    bevelSegments: 2,
  });
  geometry.computeBoundingBox();
  const glyphSize = geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3(1, 1, 1);
  const scale = height / glyphSize.y;
  geometry.scale(scale, scale, depth / glyphSize.z);
  geometry.center();
  geometry.computeBoundingBox();
  const size = geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3();
  return { character: glyph.character, geometry, size };
}

function colliderSize(object: THREE.Object3D): THREE.Vector3 {
  const collider = object.children.find((child) => COLLIDER_PATTERN.test(child.name));
  if (!collider) throw new Error(`${object.name} has no collider`);
  return collider.scale.clone();
}

function paintCutout(geometry: THREE.BufferGeometry, index: number): void {
  const { count } = geometry.getAttribute('position');
  const face = new THREE.Color(FACE_COLORS[index % FACE_COLORS.length]);
  const edge = new THREE.Color(EDGE_COLOR);
  const caps = geometry.groups[CAP_GROUP];
  const capEnd = caps ? caps.start + caps.count : 0;
  const colors = new Float32Array(count * 3);
  for (let vertex = 0; vertex < count; vertex += 1) {
    const isCap = vertex < capEnd;
    const { r, g, b } = isCap ? face : edge;
    colors.set([r, g, b], vertex * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.deleteAttribute('uv');
  geometry.clearGroups();
}

const isMesh = (object: THREE.Object3D): object is THREE.Mesh => object instanceof THREE.Mesh;

export function replaceLandingName(model: THREE.Object3D): void {
  const originals = model.children.filter((child) => LETTERS_PATTERN.test(child.name)).filter(isMesh);
  const template = originals[0];
  if (!template) throw new Error('출발 구역의 글자 기준 모델이 없습니다.');

  const letterSize = colliderSize(template);
  const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(template.quaternion);
  const alongSpan = (object: THREE.Object3D): number => object.position.dot(direction);
  originals.sort((a, b) => alongSpan(a) - alongSpan(b));
  const first = originals[0] ?? template;
  const last = originals.at(-1) ?? template;
  const start = first.position.clone().addScaledVector(direction, -colliderSize(first).x / 2);
  const span = alongSpan(last) - alongSpan(first) + (colliderSize(first).x + colliderSize(last).x) / 2;

  const syllables = NAME_GLYPHS.map((glyph) => syllableGeometry(glyph, letterSize.y * HEIGHT_SCALE, letterSize.z));
  const gap = SYLLABLE_GAP * letterSize.y;
  const totalWidth = syllables.reduce((total, { size }) => total + size.x, 0) + gap * (syllables.length - 1);
  let cursor = span * SPAN_CENTER - totalWidth / 2;

  for (const original of originals) model.remove(original);
  for (const [index, { character, geometry, size }] of syllables.entries()) {
    paintCutout(geometry, index);
    const mesh = new THREE.Mesh(geometry, islandMaterialByKey(VERTEX_COLOR_KEY));
    mesh.name = `refLettersPhysicalDynamic${index}`;
    mesh.userData = { ...template.userData, letter: character };
    mesh.position.copy(start).addScaledVector(direction, cursor + size.x / 2);
    mesh.position.y = template.position.y - letterSize.y / 2 + size.y / 2;
    mesh.quaternion.copy(template.quaternion);
    mesh.rotateY(YAW_JITTER[index % YAW_JITTER.length] ?? 0);
    const collider = new THREE.Object3D();
    collider.name = `cuboidName${index}`;
    collider.scale.copy(size);
    mesh.add(collider);
    model.add(mesh);
    cursor += size.x + gap;
  }
}
