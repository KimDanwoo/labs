import { Fn, texture, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial, revealNode } from '../materials/meshDefaultMaterial';
import { createParts, FULL_TURN, type PartName, type Parts, seededRandom, type Triple } from './islandGeometry';
import { islandModelMesh } from './islandModels';

export interface Frame {
  readonly size: THREE.Vector3;
  readonly matrix: THREE.Matrix4;
}

interface Roof {
  readonly center: Triple;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
}

interface Pillar {
  readonly x: number;
  readonly z: number;
  readonly bottom: number;
  readonly top: number;
  readonly radius?: number;
}

const UNIT_SCALE = new THREE.Vector3(1, 1, 1);
const CUBOID = /^cuboid/;
const COLLIDER_NAME = /^(cuboid|hull|trimesh|tube|ball)/i;

function cuboidFrame(cuboid: THREE.Object3D): Frame {
  return {
    size: cuboid.scale.clone(),
    matrix: new THREE.Matrix4().compose(cuboid.position, cuboid.quaternion, UNIT_SCALE),
  };
}

function findChild(parent: THREE.Object3D, name: string): THREE.Object3D {
  const child = parent.children.find((item) => item.name === name);
  if (!child) throw new Error(`월드 모델에서 ${name}을 찾지 못했어요.`);
  return child;
}

function findChildMatching(parent: THREE.Object3D, pattern: RegExp): THREE.Object3D {
  const child = parent.children.find((item) => pattern.test(item.name));
  if (!child) throw new Error(`월드 모델에서 ${pattern.source}을 찾지 못했어요.`);
  return child;
}

function requireMesh(object: THREE.Object3D): THREE.Mesh {
  if (!(object instanceof THREE.Mesh)) throw new Error(`월드 모델 ${object.name}이 메시가 아니에요.`);
  return object;
}

function swapForGroup(target: THREE.Object3D): THREE.Object3D {
  const replacement = new THREE.Object3D();
  replacement.name = target.name;
  replacement.position.copy(target.position);
  replacement.quaternion.copy(target.quaternion);
  replacement.scale.copy(target.scale);
  replacement.userData = { ...target.userData };
  for (const child of [...target.children]) replacement.add(child);
  target.parent?.add(replacement);
  target.removeFromParent();
  return replacement;
}

function replaceVisual(
  parent: THREE.Object3D,
  name: string,
  build: (container: THREE.Object3D) => THREE.Object3D,
): THREE.Object3D {
  const target = findChild(parent, name);
  const container = target instanceof THREE.Mesh ? swapForGroup(target) : target;
  container.add(build(container));
  return container;
}

function thatchRoof(parts: Parts, { center, width, depth, height }: Roof): void {
  const [x, y, z] = center;
  parts.add('thatch', new THREE.SphereGeometry(1, 12, 5, 0, FULL_TURN, 0, Math.PI / 2), {
    position: [x, y, z],
    scale: [width / 2, height, depth / 2],
  });
  parts.add('thatchRope', new THREE.TorusGeometry(1, 0.03, 4, 16), {
    position: [x, y + height * 0.35, z],
    rotation: [Math.PI / 2, 0, 0],
    scale: [(width / 2) * 0.94, (depth / 2) * 0.94, 1],
  });
  parts.add('thatch', new THREE.SphereGeometry(1, 8, 4), {
    position: [x, y + height * 0.98, z],
    scale: [width * 0.12, height * 0.16, depth * 0.12],
  });
}

function pillar(parts: Parts, material: PartName, { x, z, bottom, top, radius = 0.2 }: Pillar): void {
  parts.box('stone', [radius * 3, 0.28, radius * 3], { position: [x, bottom + 0.14, z] });
  parts.prism(material, radius, radius * 1.05, top - bottom - 0.28, { position: [x, (bottom + 0.28 + top) / 2, z] });
}

export function rebuildProjectsGate(model: THREE.Object3D): void {
  replaceVisual(model, 'Cube065', () => {
    const parts = createParts();
    const ground = -0.13;
    const top = 3.75;
    for (const [x, z] of [
      [-2.25, 0],
      [2.25, 0],
      [4.6, 1.5],
    ] as const) {
      pillar(parts, 'wood', { x, z, bottom: ground, top, radius: 0.22 });
    }
    parts.box('woodDark', [5.6, 0.3, 0.4], { position: [0, top - 0.1, 0] });
    parts.box('woodDark', [2.4, 0.22, 0.3], { position: [3.45, top - 0.6, 0.75], rotation: [0, -0.57, 0] });
    thatchRoof(parts, { center: [0, top + 0.1, 0], width: 6.4, depth: 2.4, height: 1.05 });
    thatchRoof(parts, { center: [4.6, top - 0.35, 1.5], width: 1.5, depth: 1.5, height: 0.6 });
    return parts.build();
  });
}

export function rebuildLabGate(model: THREE.Object3D): void {
  replaceVisual(model, 'Cube003', () => {
    const parts = createParts();
    const ground = -1.82;
    const top = 2.95;
    for (const x of [-2.25, 2.25, 5.1]) pillar(parts, 'wood', { x, z: 0.25, bottom: ground, top, radius: 0.22 });
    parts.box('woodDark', [7.9, 0.3, 0.4], { position: [1.42, top, 0.25] });
    parts.rod('woodDark', 0.08, [-2.25, top - 1.0, 0.25], [-1.35, top - 0.1, 0.25]);
    parts.rod('woodDark', 0.08, [2.25, top - 1.0, 0.25], [1.35, top - 0.1, 0.25]);
    thatchRoof(parts, { center: [1.42, top + 0.12, 0.25], width: 9, depth: 2.8, height: 1.15 });
    return parts.build();
  });
}

const SCREEN_ASPECT = 1.5;
const GUIDE_BOARD = { screenWidth: 0.68, screenHeight: 0.43, screenY: -0.01, screenFront: 0.11 } as const;

export interface NoticeBoard {
  readonly group: THREE.Group;
  readonly screen: THREE.Mesh<THREE.PlaneGeometry, MeshDefaultMaterial>;
}

function boardScreen(board: Frame, screen: THREE.Texture, segments: number): NoticeBoard['screen'] {
  const { x: boardWidth, y: boardHeight } = board.size;
  const width = Math.min(GUIDE_BOARD.screenWidth * boardWidth, GUIDE_BOARD.screenHeight * boardHeight * SCREEN_ASPECT);
  const geometry = new THREE.PlaneGeometry(width, width / SCREEN_ASPECT, segments, segments);
  const material = new MeshDefaultMaterial({
    colorNode: texture(screen).rgb,
    hasCoreShadows: false,
    hasDropShadows: false,
  });
  material.userData.prevent = true;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'boardScreen';
  mesh.receiveShadow = true;
  mesh.matrixAutoUpdate = false;
  mesh.matrix
    .copy(board.matrix)
    .multiply(new THREE.Matrix4().makeTranslation(0, GUIDE_BOARD.screenY * boardHeight, GUIDE_BOARD.screenFront));
  return mesh;
}

export function noticeBoard(
  board: Frame,
  screen: THREE.Texture,
  { segments = 1 }: { segments?: number } = {},
): NoticeBoard {
  const screenMesh = boardScreen(board, screen, segments);
  const group = new THREE.Group().add(islandModelMesh('guideBoard', board.matrix, board.size), screenMesh);
  return { group, screen: screenMesh };
}

export function rebuildKiosk(model: THREE.Object3D, mapTexture: THREE.Texture): void {
  replaceVisual(
    model,
    'physicalFixed009',
    (container) => noticeBoard(cuboidFrame(findChild(container, 'cuboid018')), mapTexture).group,
  );
}

const SNACK_SHACK = {
  size: new THREE.Vector3(3.4, 5.1, 3.1),
  center: [-0.8, 0.75, -0.45],
  pole: { x: 4.71, z: 0.22, bottom: -1.8, top: 2.5 },
} as const;

export function rebuildCookieCart(model: THREE.Object3D): void {
  const container = findChild(model, 'cookiePhysicalFixed');
  findChild(container, 'Cube135').removeFromParent();
  const { size, center, pole } = SNACK_SHACK;
  const parts = createParts();
  parts.rod('woodDark', 0.11, [pole.x, pole.bottom, pole.z], [pole.x, pole.top, pole.z], 6);
  container.add(parts.build(), islandModelMesh('snackShack', new THREE.Matrix4().makeTranslation(...center), size));
}

export function rebuildOuthouse(model: THREE.Object3D): void {
  const container = findChild(model, 'refCabinPhysicalDynamic');
  findChild(container, 'wood002').removeFromParent();
  const parts = createParts();
  const bottom = -1.9;
  const top = 1.3;
  const height = top - bottom;
  const middle = bottom + height / 2;
  parts.box('stone', [1.9, 0.18, 1.85], { position: [0, bottom + 0.09, -0.04] });
  for (const x of [-0.82, 0.82]) {
    for (const z of [-0.82, 0.74]) parts.box('woodDark', [0.16, height, 0.16], { position: [x, middle, z] });
  }
  parts.box('wood', [0.08, height - 0.3, 1.5], { position: [-0.84, middle, -0.04] });
  parts.box('wood', [0.08, height - 0.3, 1.5], { position: [0.84, middle, -0.04] });
  parts.box('wood', [1.6, height - 0.3, 0.08], { position: [0, middle, -0.86] });
  for (let index = 0; index < 4; index += 1) {
    parts.box('wood', [0.36, height - 0.4, 0.07], { position: [-0.57 + index * 0.38, middle - 0.05, 0.74] });
  }
  for (const y of [bottom + 0.7, top - 0.75]) parts.box('woodDark', [1.5, 0.12, 0.05], { position: [0, y, 0.79] });
  parts.prism('iron', 0.07, 0.07, 0.05, { position: [0.48, middle - 0.2, 0.8], rotation: [Math.PI / 2, 0, 0] }, 8);
  thatchRoof(parts, { center: [0, top, -0.04], width: 3.1, depth: 3.0, height: 0.7 });
  container.add(parts.build());
}

const BRIDGE = { plankPitch: 0.46, plankDepth: 0.42, railX: 2.09, posts: 6 } as const;

export function rebuildBridge(bridge: THREE.Object3D): void {
  const replacement = swapForGroup(bridge);
  const deck = replacement.children.find((child) => CUBOID.test(child.name) && child.scale.x > 3);
  if (!deck) throw new Error('다리 상판 충돌체를 찾지 못했어요.');
  const parts = createParts();
  const top = deck.position.y + deck.scale.y / 2;
  const halfWidth = deck.scale.x / 2;
  const front = deck.position.z - deck.scale.z / 2;
  const back = deck.position.z + deck.scale.z / 2;
  const planks = Math.round((back - front) / BRIDGE.plankPitch);
  for (let index = 0; index < planks; index += 1) {
    const z = front + 0.23 + index * ((back - front - BRIDGE.plankPitch) / (planks - 1));
    parts.box('wood', [halfWidth * 2, 0.14, BRIDGE.plankDepth], { position: [deck.position.x, top - 0.07, z] });
  }
  for (const x of [-halfWidth + 0.5, halfWidth - 0.5]) {
    parts.box('woodDark', [0.3, 0.32, back - front], { position: [x, top - 0.3, deck.position.z] });
  }
  const railStart = front + 0.6;
  const railEnd = back - 1.15;
  for (const side of [-1, 1]) {
    const x = side * BRIDGE.railX;
    for (let index = 0; index < BRIDGE.posts; index += 1) {
      const z = railStart + (index * (railEnd - railStart)) / (BRIDGE.posts - 1);
      parts.prism('woodDark', 0.1, 0.11, 1.05, { position: [x, top + 0.52, z] });
      parts.add('wood', new THREE.SphereGeometry(0.13, 6, 4), { position: [x, top + 1.1, z] });
    }
    parts.rod('wood', 0.07, [x, top + 0.95, railStart], [x, top + 0.95, railEnd], 6);
    parts.rod('wood', 0.05, [x, top + 0.5, railStart], [x, top + 0.5, railEnd], 6);
    for (const z of [front - 0.1, back + 0.1]) parts.box('stone', [0.7, 0.5, 0.8], { position: [x, top - 0.3, z] });
  }
  replacement.add(parts.build());
}

const SURFBOARD_PROPORTION = { width: 0.27, depth: 0.15 } as const;

function surfboardSize(height: number): THREE.Vector3 {
  return new THREE.Vector3(height * SURFBOARD_PROPORTION.width, height, height * SURFBOARD_PROPORTION.depth);
}

const SURF_FLAG_PROPORTION = { width: 0.375, depth: 0.125 } as const;

function surfFlagSize(height: number): THREE.Vector3 {
  return new THREE.Vector3(height * SURF_FLAG_PROPORTION.width, height, height * SURF_FLAG_PROPORTION.depth);
}

export function rebuildSurfPoint(model: THREE.Object3D): void {
  findChild(model, 'Cube173').removeFromParent();
  findChild(model, 'refSkullEyes5').removeFromParent();
  const container = findChild(model, 'physicalFixed005');
  const parts = createParts();
  const ground = requireMesh(findChildMatching(container, /^trimesh/));
  ground.updateMatrix();
  parts.add('sand', ground.geometry.clone(), { matrix: ground.matrix });
  const pillars = container.children
    .filter((child) => CUBOID.test(child.name))
    .map(cuboidFrame)
    .sort((a, b) => b.size.y - a.size.y);
  const flags = pillars
    .slice(0, 3)
    .map(({ size, matrix }) => islandModelMesh('surfFlag', matrix, surfFlagSize(size.y)));
  const boards = pillars
    .slice(3)
    .map(({ size, matrix }) => islandModelMesh('surfboardStand', matrix, surfboardSize(size.y)));
  container.add(parts.build(), ...flags, ...boards);
}

function removeVisualMeshes(container: THREE.Object3D): void {
  for (const child of container.children.filter(
    (item) => item instanceof THREE.Mesh && !COLLIDER_NAME.test(item.name),
  )) {
    child.removeFromParent();
  }
}

function boulderStack(
  parts: Parts,
  random: () => number,
  { size, matrix }: Frame,
  shades: readonly PartName[] = ['fieldstone', 'stoneDark'],
): void {
  const layers = Math.max(1, Math.round(size.y / 1.3));
  const layerHeight = size.y / layers;
  for (let index = 0; index < layers; index += 1) {
    parts.add(shades[index % shades.length] ?? 'fieldstone', new THREE.IcosahedronGeometry(1, 0), {
      position: [(random() - 0.5) * 0.15, -size.y / 2 + layerHeight * (index + 0.5), (random() - 0.5) * 0.15],
      rotation: [0, random() * FULL_TURN, 0],
      scale: [(size.x / 2) * 1.12, (layerHeight / 2) * 1.2, (size.z / 2) * 1.12],
      matrix,
    });
  }
}

const PAGODA_TIERS = [
  [0.95, 0.62],
  [0.75, 0.36],
  [0.62, 0.32],
] as const;

function stonePagoda(parts: Parts, { x, y, z }: { x: number; y: number; z: number }): void {
  parts.box('stone', [2.0, 0.32, 2.0], { position: [x, y + 0.16, z] });
  parts.box('stone', [1.6, 0.28, 1.6], { position: [x, y + 0.46, z] });
  let level = y + 0.6;
  for (const [width, height] of PAGODA_TIERS) {
    parts.box('stone', [width, height, width], { position: [x, level + height / 2, z] });
    level += height;
    parts.box('stoneDark', [width + 0.75, 0.12, width + 0.75], { position: [x, level + 0.06, z] });
    const corner = (width + 0.68) / 2;
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        parts.box('stoneDark', [0.2, 0.08, 0.2], { position: [x + sideX * corner, level + 0.13, z + sideZ * corner] });
      }
    }
    level += 0.12;
  }
  parts.prism('stoneDark', 0.1, 0.16, 0.25, { position: [x, level + 0.12, z] });
  parts.add('stone', new THREE.IcosahedronGeometry(0.1, 0), { position: [x, level + 0.32, z] });
}

export function rebuildWaterfallPagoda(model: THREE.Object3D): void {
  findChild(model, 'Cube089').removeFromParent();
  const container = findChild(model, 'physicalFixed008');
  const random = seededRandom(31);
  const parts = createParts();
  for (const cuboid of container.children.filter((child) => CUBOID.test(child.name))) {
    const frame = cuboidFrame(cuboid);
    const isPillarColumn = Math.hypot(cuboid.position.x, cuboid.position.z) < 0.1 && frame.size.y > 3;
    if (isPillarColumn) continue;
    if (frame.size.y > 3) boulderStack(parts, random, frame);
    else if (frame.size.y <= 0.2) parts.box('stone', [frame.size.x, 0.2, frame.size.z], { matrix: frame.matrix });
    else {
      parts.box(frame.size.x < 0.5 ? 'stoneDark' : 'stone', [frame.size.x, frame.size.y, frame.size.z], {
        matrix: frame.matrix,
      });
    }
  }
  const hull = requireMesh(findChildMatching(container, /^hull/));
  hull.updateMatrix();
  parts.add('fieldstone', hull.geometry.clone(), { matrix: hull.matrix });
  hull.geometry.computeBoundingBox();
  const bounds = hull.geometry.boundingBox;
  if (bounds) {
    const top = bounds.clone().applyMatrix4(hull.matrix);
    stonePagoda(parts, { x: (top.min.x + top.max.x) / 2, y: top.max.y - 0.1, z: (top.min.z + top.max.z) / 2 });
  }
  container.add(parts.build());
}

const NEON_GAIN = 2.2;

function neonMaterial(neonTexture: THREE.Texture): THREE.MeshBasicNodeMaterial {
  neonTexture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.outputNode = Fn(() => {
    const sample = texture(neonTexture, uv());
    return vec4(revealNode(sample.rgb.mul(NEON_GAIN)), 1);
  })();
  material.fog = false;
  material.userData.prevent = true;
  return material;
}

export function rebuildBowlingSign(model: THREE.Object3D, neonTexture: THREE.Texture): void {
  findChild(model, 'sign001').removeFromParent();
  const sign = swapForGroup(findChild(model, 'sign002'));
  const parts = createParts();
  parts.box('neonBoard', [4.0, 2.05, 0.12], { position: [0.05, -0.04, -0.08] });
  for (const side of [-1, 1]) parts.box('metalDark', [0.14, 4.4, 0.14], { position: [side * 1.6, -3.1, -0.12] });
  const group = parts.build();
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 1.9), neonMaterial(neonTexture));
  neon.name = 'neon';
  neon.position.set(0.05, -0.04, 0.0);
  group.add(neon);
  sign.add(group);
}

export function rebuildJukebox(model: THREE.Object3D): THREE.Mesh {
  const container = findChild(model, 'refJukeboxPhysicalDynamic');
  container.name = 'refJukeboxPhysicalFixed';
  removeVisualMeshes(container);
  const collider = cuboidFrame(findChildMatching(container, CUBOID));
  const mesh = islandModelMesh('jukebox', collider.matrix, collider.size);
  container.add(mesh);
  return mesh;
}

function timberPile(parts: Parts, { size, matrix }: Frame): void {
  const layers = 4;
  const beam = size.y / layers;
  for (let layer = 0; layer < layers; layer += 1) {
    for (const offset of [-1, 0, 1]) {
      parts.box('timber', [size.x, beam * 0.9, size.z / 3.3], {
        position: [0, -size.y / 2 + beam * (layer + 0.5), offset * (size.z / 3.1) + (layer % 2) * 0.04],
        matrix,
      });
    }
  }
  for (const x of [-size.x * 0.3, size.x * 0.3]) {
    parts.box('thatchRope', [0.06, size.y + 0.02, size.z + 0.04], { position: [x, 0, 0], matrix });
  }
}

function hangingLantern(parts: Parts, { matrix, z, y }: { matrix: THREE.Matrix4; z: number; y: number }): void {
  parts.box('woodDark', [0.02, 0.1, 0.02], { position: [0, y + 0.17, z], matrix });
  for (const offsetY of [0.13, -0.13])
    parts.box('woodDark', [0.3, 0.04, 0.3], { position: [0, y + offsetY, z], matrix });
  parts.box('lantern', [0.24, 0.22, 0.24], { position: [0, y, z], matrix });
}

function rebuildGenerator(generator: THREE.Object3D): void {
  removeVisualMeshes(generator);
  const cuboids = generator.children
    .filter((child) => CUBOID.test(child.name))
    .map(cuboidFrame)
    .sort((a, b) => b.size.y - a.size.y);
  const pole = cuboids[0];
  const pile = cuboids.find((frame) => frame !== pole && frame.size.x > 1);
  const crossbar = cuboids.find((frame) => frame !== pole && frame !== pile);
  if (!pole || !pile || !crossbar) throw new Error('발전기 충돌체 구성이 예상과 달라요.');
  const parts = createParts();
  timberPile(parts, pile);
  parts.box('woodDark', [pole.size.x * 0.9, pole.size.y, pole.size.z * 0.9], { matrix: pole.matrix });
  parts.box('wood', [crossbar.size.x * 0.9, crossbar.size.y * 0.8, crossbar.size.z], { matrix: crossbar.matrix });
  for (const z of [-crossbar.size.z * 0.42, crossbar.size.z * 0.42]) {
    hangingLantern(parts, { matrix: crossbar.matrix, z, y: -0.45 });
  }
  generator.add(parts.build());
}

function stackedTiles(): THREE.Group {
  const parts = createParts();
  parts.box('stoneDark', [0.85, 0.1, 0.85], { position: [0, -0.46, 0] });
  for (let index = 0; index < 6; index += 1) {
    parts.add('terracotta', new THREE.CylinderGeometry(0.3, 0.3, 0.62, 8, 1, false, 0, Math.PI), {
      position: [0, -0.38 + index * 0.15, 0],
      rotation: [0, index % 2 === 0 ? 0 : Math.PI / 2, Math.PI / 2],
      scale: [1, 1, 0.55],
    });
  }
  return parts.build();
}

export function rebuildBuildingSite(model: THREE.Object3D): void {
  for (const generator of model.children.filter((child) => /^lightGeneratorPhysicalDynamic/.test(child.name))) {
    rebuildGenerator(generator);
  }
  for (const cone of model.children.filter((child) => /^refObjectsPhysicalDynamic/.test(child.name))) {
    replaceVisual(model, cone.name, stackedTiles);
  }
}
