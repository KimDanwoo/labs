import { texture } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial';
import { createParts } from './islandGeometry';
import { islandModelGeometry, islandModelMesh, islandPaletteMaterial } from './islandModels';
import { cuboidFrame, findChild, palmRoof, pillar, replaceVisual, type Frame } from './structureKit';

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
