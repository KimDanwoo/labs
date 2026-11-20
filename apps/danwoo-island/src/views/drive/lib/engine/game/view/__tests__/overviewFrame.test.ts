import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as THREE from 'three';

import { frameOverview, type ScreenInsets } from '@views/drive/lib/engine/game/view/overviewFrame';

const PHI = Math.PI * 0.2;
const THETA = Math.PI * 0.25;
const FOV = 25;
const PIXEL_TOLERANCE = 0.5;
const FILL_TOLERANCE = 6;
const PINS = [
  [10, -20],
  [-59, 30],
  [75, 5],
  [0, 62],
  [-30, -70],
  [40, 40],
].map(([x, z]) => new THREE.Vector3(x, 1.6, z));
const INSETS = {
  wide: { top: 130, right: 290, bottom: 75, left: 60 },
  compact: { top: 120, right: 40, bottom: 80, left: 40 },
  short: { top: 120, right: 340, bottom: 80, left: 40 },
} as const satisfies Record<string, ScreenInsets>;
const CASES = [
  { width: 390, height: 844, insets: INSETS.compact },
  { width: 375, height: 667, insets: INSETS.compact },
  { width: 721, height: 390, insets: INSETS.short },
  { width: 740, height: 390, insets: INSETS.short },
  { width: 844, height: 390, insets: INSETS.short },
  { width: 721, height: 241, insets: INSETS.short },
  { width: 1440, height: 900, insets: INSETS.wide },
] as const;

function projectToScreen(width: number, height: number, insets: ScreenInsets): THREE.Vector2[] {
  const frame = frameOverview({ points: PINS, phi: PHI, theta: THETA, fov: FOV, width, height, insets });
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 1, 5000);
  camera.position.setFromSphericalCoords(frame.radius, PHI, THETA).add(frame.center);
  camera.lookAt(frame.center);
  camera.updateMatrixWorld();
  return PINS.map((point) => {
    const ndc = point.clone().project(camera);
    return new THREE.Vector2(((ndc.x + 1) / 2) * width, ((1 - ndc.y) / 2) * height);
  });
}

describe('frameOverview', () => {
  for (const { width, height, insets } of CASES) {
    it(`${width}x${height}에서 모든 핀을 여백 안에 둔다`, () => {
      for (const { x, y } of projectToScreen(width, height, insets)) {
        assert.ok(x >= insets.left - PIXEL_TOLERANCE, `x=${x}`);
        assert.ok(x <= width - insets.right + PIXEL_TOLERANCE, `x=${x}`);
        assert.ok(y >= insets.top - PIXEL_TOLERANCE, `y=${y}`);
        assert.ok(y <= height - insets.bottom + PIXEL_TOLERANCE, `y=${y}`);
      }
    });

    it(`${width}x${height}에서 핀 묶음이 여백 안을 한 축 끝에서 끝까지 채운다`, () => {
      const screen = projectToScreen(width, height, insets);
      const xs = screen.map(({ x }) => x);
      const ys = screen.map(({ y }) => y);
      const gaps = {
        left: Math.min(...xs) - insets.left,
        right: width - insets.right - Math.max(...xs),
        top: Math.min(...ys) - insets.top,
        bottom: height - insets.bottom - Math.max(...ys),
      };
      const fillsWidth = gaps.left < FILL_TOLERANCE && gaps.right < FILL_TOLERANCE;
      const fillsHeight = gaps.top < FILL_TOLERANCE && gaps.bottom < FILL_TOLERANCE;
      assert.ok(fillsWidth || fillsHeight, JSON.stringify(gaps));
    });
  }
});
