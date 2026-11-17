import { Fn, texture, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial, revealNode } from '../materials/meshDefaultMaterial';
import { createParts, type PartName, type Parts, removeComponents, type Triple } from './islandGeometry';
import { islandModelGeometry, islandModelMesh, islandPaletteMaterial } from './islandModels';
import { placedInArea } from './layout/areaPlacement';
import { pushOutOfShowerBay, SHOWER_SCALE } from './showerBay';

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

const ROOF_OVERHANG = 1.04;

function palmRoof({ center, width, depth, height }: Roof): THREE.Mesh {
  const [x, y, z] = center;
  const matrix = new THREE.Matrix4().makeTranslation(x, y + height / 2, z);
  return islandModelMesh('palmRoof', matrix, new THREE.Vector3(width * ROOF_OVERHANG, height, depth * ROOF_OVERHANG));
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
    return parts
      .build()
      .add(
        palmRoof({ center: [0, top + 0.18, 0], width: 6.0, depth: 2.2, height: 0.7 }),
        palmRoof({ center: [4.6, top - 0.3, 1.5], width: 1.4, depth: 1.4, height: 0.45 }),
      );
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
    return parts.build().add(palmRoof({ center: [1.42, top + 0.18, 0.25], width: 8.4, depth: 2.6, height: 0.75 }));
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

const KEYBOARD_DECK = 'Plane002';
const OLD_MAP_PLAQUE = 'stylizedMap';

export function rebuildKeyboardDeck(model: THREE.Object3D): void {
  const deck = model.getObjectByName(KEYBOARD_DECK);
  if (!(deck instanceof THREE.Mesh)) throw new Error('컨트롤 키보드 받침을 찾지 못했어요.');
  deck.geometry.dispose();
  deck.geometry = islandModelGeometry('driftKeyboard');
  deck.material = islandPaletteMaterial('driftKeyboard');
}

function hideOldMapPlaque(model: THREE.Object3D): void {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && !Array.isArray(child.material) && child.material.name === OLD_MAP_PLAQUE) {
      child.geometry.setDrawRange(0, 0);
    }
  });
}

export function rebuildKiosk(model: THREE.Object3D, mapTexture: THREE.Texture): void {
  hideOldMapPlaque(model);
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

const SHOWER_STATION = {
  floor: -1.9,
  postSize: new THREE.Vector3(0.3, 2.7, 0.3),
  posts: [
    [-1.45, -0.85],
    [1.45, -0.85],
    [-1.45, 0.85],
    [1.45, 0.85],
  ],
  lantern: { size: [0.2, 0.26, 0.2], position: [-1.64, 1.65, 1.0] },
} as const;

export const SHOWER_PARTS = { waterAnchor: 'showerWaterAnchor', lanternGlow: 'showerLanternGlow' } as const;

const TOILET_PAPER = /^paper/;
const LOOSE_PROP = /^stool/;
const BASE_STONES = /^rocks/;

const scaled = (value: number): number => value * SHOWER_SCALE;

function growWithStation(object: THREE.Object3D, center: THREE.Vector3): void {
  object.position.x = center.x + scaled(object.position.x - center.x);
  object.position.z = center.z + scaled(object.position.z - center.z);
  object.scale.multiplyScalar(SHOWER_SCALE);
}

export function rebuildShowerStation(model: THREE.Object3D): void {
  for (const roll of model.children.filter((child) => TOILET_PAPER.test(child.name))) roll.removeFromParent();
  const container = findChild(model, 'refCabinPhysicalDynamic');
  container.name = 'refCabinPhysicalFixed';
  for (const prop of model.children.filter((child) => LOOSE_PROP.test(child.name))) {
    pushOutOfShowerBay(prop.position, container.position);
  }
  for (const stones of model.children.filter((child) => BASE_STONES.test(child.name))) {
    growWithStation(stones, container.position);
  }
  for (const child of [...container.children]) child.removeFromParent();
  const { floor, postSize, posts, lantern } = SHOWER_STATION;
  const modelMatrix = new THREE.Matrix4()
    .makeTranslation(0, floor, 0)
    .scale(new THREE.Vector3().setScalar(SHOWER_SCALE));
  container.add(islandModelMesh('beachShower', modelMatrix));
  for (const [x, z] of posts) {
    const collider = new THREE.Object3D();
    collider.name = 'cuboid';
    collider.scale.copy(postSize).multiplyScalar(SHOWER_SCALE);
    collider.position.set(scaled(x), floor + scaled(postSize.y) / 2, scaled(z));
    container.add(collider);
  }
  const parts = createParts();
  const [x, y, z] = lantern.position;
  const [width, height, depth] = lantern.size;
  parts.box('lantern', [scaled(width), scaled(height), scaled(depth)], {
    position: [scaled(x), floor + scaled(y), scaled(z)],
  });
  const lanternGlow = parts.build();
  lanternGlow.name = SHOWER_PARTS.lanternGlow;
  const waterAnchor = new THREE.Group();
  waterAnchor.name = SHOWER_PARTS.waterAnchor;
  waterAnchor.position.y = floor;
  waterAnchor.scale.setScalar(SHOWER_SCALE);
  container.add(lanternGlow, waterAnchor);
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

const NEON_GAIN = 1.6;
const BOWLING_SIGN = { scale: 0.65, poleBottom: 5.3 } as const;

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

const BOWLING_SIGN_ART = { meshes: ['Plane042', 'Plane043'], reach: 2.5 } as const;

function removeOldSignArt(model: THREE.Object3D, sign: THREE.Object3D): void {
  model.updateMatrixWorld(true);
  const signPosition = sign.getWorldPosition(new THREE.Vector3());
  for (const name of BOWLING_SIGN_ART.meshes) {
    const art = requireMesh(findChild(model, name));
    const anchor = art.worldToLocal(signPosition.clone());
    removeComponents(art, ({ box }) => {
      const center = box.getCenter(new THREE.Vector3());
      return Math.hypot(center.x - anchor.x, center.z - anchor.z) < BOWLING_SIGN_ART.reach;
    });
  }
}

export function rebuildBowlingSign(model: THREE.Object3D, neonTexture: THREE.Texture): void {
  findChild(model, 'sign001').removeFromParent();
  removeOldSignArt(model, findChild(model, 'sign002'));
  const sign = swapForGroup(findChild(model, 'sign002'));
  const parts = createParts();
  parts.box('neonBoard', [4.0, 2.05, 0.12], { position: [0.05, -0.04, -0.08] });
  for (const side of [-1, 1]) parts.box('metalDark', [0.14, 4.4, 0.14], { position: [side * 1.6, -3.1, -0.12] });
  const group = parts.build();
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 1.9), neonMaterial(neonTexture));
  neon.name = 'neon';
  neon.position.set(0.05, -0.04, 0.0);
  group.add(neon);
  group.scale.setScalar(BOWLING_SIGN.scale);
  group.position.y = -BOWLING_SIGN.poleBottom * (1 - BOWLING_SIGN.scale);
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

const GENERATOR_SURFBOARD_HEIGHT = 2.6;

function rebuildGenerator(generator: THREE.Object3D): void {
  removeVisualMeshes(generator);
  const cuboids = generator.children.filter((child) => CUBOID.test(child.name)).sort((a, b) => b.scale.y - a.scale.y);
  const [poleCuboid] = cuboids;
  const pileCuboid = cuboids.find((cuboid) => cuboid !== poleCuboid && cuboid.scale.x > 1);
  if (!poleCuboid || !pileCuboid) throw new Error('발전기 충돌체 구성이 예상과 달라요.');
  for (const extra of cuboids.filter((cuboid) => cuboid !== poleCuboid && cuboid !== pileCuboid))
    extra.removeFromParent();
  const pole = cuboidFrame(poleCuboid);
  const parts = createParts();
  timberPile(parts, cuboidFrame(pileCuboid));
  const bottom = new THREE.Vector3(0, -pole.size.y / 2, 0).applyMatrix4(pole.matrix);
  const boardHeight = Math.min(GENERATOR_SURFBOARD_HEIGHT, pole.size.y);
  const boardMatrix = new THREE.Matrix4().makeTranslation(bottom.x, bottom.y + boardHeight / 2, bottom.z);
  generator.add(parts.build(), islandModelMesh('surfboardStand', boardMatrix, surfboardSize(boardHeight)));
}

const CRATE_STACK = {
  size: new THREE.Vector3(0.85, 0.85, 1.0),
  upright: new THREE.Matrix4().makeRotationX(-Math.PI / 2),
} as const;

function coconutCrateStack(): THREE.Mesh {
  return islandModelMesh('coconutCrate', CRATE_STACK.upright, CRATE_STACK.size);
}

export function rebuildBuildingSite(model: THREE.Object3D): void {
  for (const generator of model.children.filter((child) => /^lightGeneratorPhysicalDynamic/.test(child.name))) {
    rebuildGenerator(generator);
  }
  for (const cone of model.children.filter((child) => /^refObjectsPhysicalDynamic/.test(child.name))) {
    replaceVisual(model, cone.name, coconutCrateStack);
  }
}

const WATERFALL_LIP_GROUND = placedInArea('achievements', new THREE.Vector3(69.665, 0, 7.29));

export function rebuildWaterfallCliff(model: THREE.Object3D): void {
  findChild(model, 'Cube089').removeFromParent();
  model.updateMatrixWorld(true);
  const anchor = model.worldToLocal(WATERFALL_LIP_GROUND.clone());
  const matrix = new THREE.Matrix4().makeTranslation(anchor);
  model.add(islandModelMesh('waterfallCliff', matrix), islandModelMesh('waterfallBasin', matrix));
}

const TOTEM = { base: 0.42, size: new THREE.Vector3(0.9, 3.2, 0.9) } as const;

export function replaceWithTotem(pillar: THREE.Object3D): void {
  if (!(pillar instanceof THREE.Mesh)) return;
  const lift = new THREE.Matrix4().makeTranslation(0, TOTEM.base + TOTEM.size.y / 2, 0);
  const totem = islandModelMesh('tikiTotem', lift, TOTEM.size);
  pillar.geometry = totem.geometry;
  pillar.material = totem.material;
}

const BONFIRE = {
  base: 'base015',
  ashes: 'refBonfireHashes',
  size: new THREE.Vector3(2.2, 0.9, 1.6),
  sink: 0.15,
} as const;

export function replaceBonfireBase(model: THREE.Object3D): void {
  const base = findChild(model, BONFIRE.base);
  const ashes = findChild(model, BONFIRE.ashes);
  base.removeFromParent();
  const marker = new THREE.Object3D();
  marker.name = ashes.name;
  marker.position.copy(ashes.position);
  ashes.parent?.add(marker);
  ashes.removeFromParent();
  ashes.updateMatrix();
  const { x, y, z } = ashes.position;
  const matrix = new THREE.Matrix4().makeTranslation(x, y + BONFIRE.size.y / 2 - BONFIRE.sink, z);
  model.add(islandModelMesh('firePit', matrix, BONFIRE.size));
}
