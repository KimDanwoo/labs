import assert from 'node:assert/strict';
import test from 'node:test';
import { constrainCameraAxis } from '../src/features/walk/lib/cameraBounds';

test('camera stays inside the painting at every edge across desktop and mobile viewports', () => {
  for (const aspect of [390 / 844, 844 / 390, 1, 1.44, 16 / 9, 3]) {
    const halfHeight = Math.min(80, 120 / aspect) * 0.47;
    for (const [halfView, halfImage] of [
      [halfHeight * aspect, 60],
      [halfHeight, 40],
    ]) {
      for (const subject of [-halfImage!, -halfImage! + 1, 0, halfImage! - 1, halfImage!]) {
        for (const oldCenter of [-100, 0, 100]) {
          const center = constrainCameraAxis(oldCenter, halfView!, halfImage!, subject - 3, subject + 12);
          assert.ok(center - halfView! >= -halfImage! - 1e-9);
          assert.ok(center + halfView! <= halfImage! + 1e-9);
        }
      }
    }
  }
});

test('camera still follows the full character when there is room inside the image', () => {
  const center = constrainCameraAxis(0, 15, 60, 25, 35);
  assert.ok(center - 15 <= 25);
  assert.ok(center + 15 >= 35);
});
