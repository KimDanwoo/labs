import * as THREE from 'three/webgpu';

import { UI_FONT_FAMILY } from './utilities/canvasFont';

export type PointAlign = 'left' | 'right';

export interface LabelArt {
  texture: THREE.Texture;
  width: number;
}

export const LABEL = {
  height: 128,
  fontSize: 92,
  nearPadding: 116,
  farPadding: 44,
  offsetVertical: 4,
  scale: 0.85,
} as const;

export function drawLabel(text: string, align: PointAlign): LabelArt {
  const font = `700 ${LABEL.fontSize}px ${UI_FONT_FAMILY}`;
  const paddingLeft = align === 'left' ? LABEL.nearPadding : LABEL.farPadding;
  const paddingRight = align === 'left' ? LABEL.farPadding : LABEL.nearPadding;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas is not supported');
  context.font = font;
  const width = Math.ceil(context.measureText(text).width) + paddingLeft + paddingRight;
  canvas.width = width;
  canvas.height = LABEL.height;

  context.fillStyle = '#00ff00';
  context.beginPath();
  context.roundRect(0, 0, width, LABEL.height, LABEL.height / 2);
  context.fill();
  context.font = font;
  context.fillStyle = '#ffff00';
  context.textAlign = 'start';
  context.textBaseline = 'middle';
  context.fillText(text, paddingLeft, LABEL.height * 0.5 + LABEL.offsetVertical);

  const labelTexture = new THREE.CanvasTexture(canvas);
  labelTexture.colorSpace = THREE.NoColorSpace;
  return { texture: labelTexture, width };
}

export function concealedOffset(align: PointAlign): number {
  return align === 'left' ? -1 : 1;
}

export function oppositeAlign(align: PointAlign): PointAlign {
  return align === 'left' ? 'right' : 'left';
}

export function cachedLabelArt(cache: Map<PointAlign, LabelArt>, text: string, align: PointAlign): LabelArt {
  const cached = cache.get(align);
  if (cached) return cached;
  const art = drawLabel(text, align);
  cache.set(align, art);
  return art;
}

export function layoutLabel(label: THREE.Mesh, { width }: LabelArt, align: PointAlign): void {
  label.scale.x = (LABEL.scale * width) / LABEL.height;
  label.scale.y = LABEL.scale;
  label.position.x = align === 'left' ? 0 : -label.scale.x;
}
