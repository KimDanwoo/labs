import { color, mix, texture, uv, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { MeshDefaultMaterial } from '@views/drive/lib/engine/game/materials/meshDefaultMaterial';
import type { WorldObject } from '@views/drive/lib/engine/game/objectColliders';
import { QUARTER_TURN } from '@views/drive/lib/engine/game/world/islandGeometry';
import {
  type IslandModelKey,
  islandModelMesh,
  islandPaletteMaterial,
} from '@views/drive/lib/engine/game/world/islandModels';

interface SignLine {
  readonly text: string;
  readonly font: string;
  readonly y: number;
  readonly maxWidth?: number;
}

const BOARD_COLOR = '#463f35';
const SIGN_FRAMES = {
  course: { model: 'circuitBoard', panelLift: 0.6 },
  reset: { model: 'resetSign', panelLift: 0.25 },
} as const satisfies Record<string, { model: IslandModelKey; panelLift: number }>;
const INK_COLOR = '#ede7d6';
const HIDDEN_TITLE = 'Text002';
const COURSE_SIGN_SIZE = [512, 512] as const;

function courseSign(checkpointCount: number): { size: readonly [number, number]; lines: readonly SignLine[] } {
  return {
    size: COURSE_SIGN_SIZE,
    lines: [
      { text: '서킷', font: '700 64px MaruBuri', y: 135 },
      { text: `${checkpointCount}개의 체크포인트를 따라`, font: '400 28px MaruBuri', y: 240, maxWidth: 440 },
      { text: '한 바퀴 달려보세요', font: '400 28px MaruBuri', y: 290, maxWidth: 440 },
      { text: '출발선에서 시작할 수 있어요', font: '400 28px MaruBuri', y: 400, maxWidth: 440 },
    ],
  };
}
const RESET_SIGN = {
  size: [256, 64],
  lines: [{ text: '장애물', font: '700 32px MaruBuri', y: 32 }],
} as const satisfies { size: readonly [number, number]; lines: readonly SignLine[] };

function signTexture({ size, lines }: { size: readonly [number, number]; lines: readonly SignLine[] }): THREE.Texture {
  const [width, height] = size;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.fillStyle = INK_COLOR;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const { text, font, y, maxWidth } of lines) {
    context.font = font;
    context.fillText(text, width / 2, y, maxWidth);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function inkedMaterial(map: THREE.Texture): MeshDefaultMaterial {
  const material = new MeshDefaultMaterial({ colorNode: color(BOARD_COLOR).rgb, hasWater: false });
  const base = material.shadedOutput;
  const ink = texture(map, uv(1));
  material.outputNode = vec4(mix(base.rgb, ink.rgb, ink.a), base.a);
  return material;
}

function hideTitle(objects: readonly WorldObject[]): void {
  const title = objects.find((item) => item.visual?.object3D.name === HIDDEN_TITLE)?.visual?.object3D;
  if (title instanceof THREE.Mesh) title.geometry.setDrawRange(0, 0);
}

export function paintCourseSign(board: THREE.Object3D, objects: readonly WorldObject[], checkpointCount: number): void {
  hideTitle(objects);
  if (board instanceof THREE.Mesh) board.material = inkedMaterial(signTexture(courseSign(checkpointCount)));
}

export function paintObstacleResetSign(sign: THREE.Object3D): void {
  if (sign instanceof THREE.Mesh) sign.material = inkedMaterial(signTexture(RESET_SIGN));
}

function panelHalfHeight(panel: THREE.Mesh): number {
  panel.geometry.computeBoundingBox();
  return (panel.geometry.boundingBox?.getSize(new THREE.Vector3()).y ?? 0) / 2;
}

function frameSign(panel: THREE.Object3D, { model, panelLift }: (typeof SIGN_FRAMES)[keyof typeof SIGN_FRAMES]): void {
  if (!(panel instanceof THREE.Mesh) || !panel.parent) return;
  const ground = panel.position.y - panelHalfHeight(panel) - panelLift;
  const matrix = new THREE.Matrix4()
    .makeTranslation(panel.position.x, ground, panel.position.z)
    .multiply(new THREE.Matrix4().makeRotationFromQuaternion(panel.quaternion))
    .multiply(new THREE.Matrix4().makeRotationY(QUARTER_TURN));
  const frame = islandModelMesh(model, matrix);
  frame.material = islandPaletteMaterial(model);
  panel.parent.add(frame);
}

export function frameCourseSigns(board: THREE.Object3D, reset: THREE.Object3D): void {
  frameSign(board, SIGN_FRAMES.course);
  frameSign(reset, SIGN_FRAMES.reset);
}
