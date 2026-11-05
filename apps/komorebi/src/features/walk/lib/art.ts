import * as THREE from 'three';

/** Canvas는 CSS 변수를 못 읽으므로 랩스 공통 서체(@tokens/css/fonts.css)를 이름으로 지정한다. */
export const CANVAS_FONT_FAMILY = "'MaruBuri', serif";

export function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('그림을 그릴 수 있는 브라우저가 필요해요.');
  paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
