import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import * as THREE from 'three';

import { frameOverview, type ScreenInsets } from '../overviewFrame';

const PHI = Math.PI * 0.2;
const THETA = Math.PI * 0.25;
const FOV = 25;
const PIXEL_TOLERANCE = 0.5;
const PINS = [
  [10, -20],
  [-59, 30],
  [75, 5],
  [0, 62],
  [-30, -70],
  [40, 40],
].map(([x, z]) => new THREE.Vector3(x, 1.6, z));
const INSETS: ScreenInsets = { top: 130, right: 125, bottom: 75, left: 40 };
const SCREENS = [
  [390, 844],
  [375, 667],
  [844, 390],
  [1440, 900],
] as const;

function projectToScreen(points: readonly THREE.Vector3[], width: number, height: number): THREE.Vector2[] {
  const frame = frameOverview({ points, phi: PHI, theta: THETA, fov: FOV, width, height, insets: INSETS });
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 1, 5000);
  camera.position.setFromSphericalCoords(frame.radius, PHI, THETA).add(frame.center);
  camera.lookAt(frame.center);
  camera.updateMatrixWorld();
  return points.map((point) => {
    const ndc = point.clone().project(camera);
    return new THREE.Vector2(((ndc.x + 1) / 2) * width, ((1 - ndc.y) / 2) * height);
  });
}

describe('frameOverview', () => {
  for (const [width, height] of SCREENS) {
    it(`${width}x${height}에서 모든 핀을 여백 안에 둔다`, () => {
      const screen = projectToScreen(PINS, width, height);
      for (const { x, y } of screen) {
        assert.ok(x >= INSETS.left - PIXEL_TOLERANCE, `x=${x}`);
        assert.ok(x <= width - INSETS.right + PIXEL_TOLERANCE, `x=${x}`);
        assert.ok(y >= INSETS.top - PIXEL_TOLERANCE, `y=${y}`);
        assert.ok(y <= height - INSETS.bottom + PIXEL_TOLERANCE, `y=${y}`);
      }
    });
  }

  it('가장 바깥 핀이 여백 경계에 닿을 만큼 당겨 잡는다', () => {
    const [width, height] = [390, 844];
    const screen = projectToScreen(PINS, width, height);
    const touchesSide = screen.some(
      ({ x }) => Math.abs(x - INSETS.left) < 1 || Math.abs(x - (width - INSETS.right)) < 1,
    );
    const touchesEnd = screen.some(
      ({ y }) => Math.abs(y - INSETS.top) < 1 || Math.abs(y - (height - INSETS.bottom)) < 1,
    );
    assert.ok(touchesSide || touchesEnd);
  });
});
