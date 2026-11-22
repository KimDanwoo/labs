import * as THREE from 'three/webgpu';

import { TextCanvas } from '@views/drive/lib/engine/game/textCanvas';
import { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { isClearOfVehicleSight } from '@views/drive/lib/engine/game/world/vehicleSeeThrough';

const SCORE = {
  font: { family: 'MaruBuri', weight: '700', size: 88 },
  canvas: { width: 320, height: 160 },
  plane: { width: 2.6, height: 1.3 },
  position: [-1.88, 2.76, 0.56],
  color: '#fff1d6',
  alphaTest: 0.5,
} as const;
const OLD_FACE_PARTS = ['discs', 'crosses', 'labelStrike'] as const;

const SIGN = {
  font: '700 92px "MaruBuri"',
  size: { width: 512, height: 252 },
  board: '#2a2230',
  glow: 18,
  lines: [
    { text: '비치볼', color: '#f47f75', y: 0.3 },
    { text: '골 넣기', color: '#49bdc5', y: 0.72 },
  ],
} as const;

export interface Scoreboard {
  readonly group: THREE.Object3D;
  write: (goals: number) => void;
}

function scoreText(goals: number): string {
  return `골 ${goals}`;
}

export function createScoreboard(area: Area): Scoreboard {
  const group = area.requireReference('screen');
  for (const name of OLD_FACE_PARTS) area.requireReference(name).removeFromParent();
  const { font, canvas, plane } = SCORE;
  const text = new TextCanvas({
    fontFamily: font.family,
    fontWeight: font.weight,
    fontSize: font.size,
    width: canvas.width,
    height: canvas.height,
  });
  text.texture.flipY = true;
  const material = new THREE.MeshBasicNodeMaterial({
    color: SCORE.color,
    alphaMap: text.texture,
    alphaTest: SCORE.alphaTest,
  });
  material.maskNode = isClearOfVehicleSight();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(plane.width, plane.height), material);
  mesh.position.set(...SCORE.position);
  group.add(mesh);
  let goals = 0;
  const write = (value: number): void => {
    goals = value;
    text.updateText(scoreText(goals));
  };
  write(goals);
  void document.fonts.load(`${font.weight} ${font.size}px "${font.family}"`).then(() => write(goals));
  return { group, write };
}

function paintSign(context: CanvasRenderingContext2D): void {
  const { width, height } = SIGN.size;
  context.fillStyle = SIGN.board;
  context.fillRect(0, 0, width, height);
  context.font = SIGN.font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowBlur = SIGN.glow;
  for (const line of SIGN.lines) {
    context.fillStyle = line.color;
    context.shadowColor = line.color;
    context.fillText(line.text, width / 2, height * line.y);
  }
}

export function beachGoalSignTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = SIGN.size.width;
  canvas.height = SIGN.size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  const texture = new THREE.CanvasTexture(canvas);
  const repaint = (): void => {
    paintSign(context);
    texture.needsUpdate = true;
  };
  repaint();
  void document.fonts.load(SIGN.font).then(repaint);
  return texture;
}
