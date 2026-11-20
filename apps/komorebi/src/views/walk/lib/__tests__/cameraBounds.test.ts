import { constrainCameraAxis } from '@views/walk/lib/cameraBounds';
import assert from 'node:assert/strict';
import test from 'node:test';

const ASPECTS = [390 / 844, 844 / 390, 1, 1.44, 16 / 9, 3];
const OLD_CENTERS = [-100, 0, 100];

interface CameraCase {
  halfView: number;
  halfImage: number;
  subject: number;
  oldCenter: number;
}

const viewsForAspect = (aspect: number) => {
  const halfHeight = Math.min(80, 120 / aspect) * 0.47;
  return [
    { halfView: halfHeight * aspect, halfImage: 60 },
    { halfView: halfHeight, halfImage: 40 },
  ];
};

const cameraCases = (): CameraCase[] =>
  ASPECTS.flatMap(viewsForAspect).flatMap(({ halfView, halfImage }) =>
    [-halfImage, -halfImage + 1, 0, halfImage - 1, halfImage].flatMap((subject) =>
      OLD_CENTERS.map((oldCenter) => ({ halfView, halfImage, subject, oldCenter })),
    ),
  );

test('camera stays inside the painting at every edge across desktop and mobile viewports', () => {
  for (const { halfView, halfImage, subject, oldCenter } of cameraCases()) {
    const center = constrainCameraAxis(oldCenter, halfView, halfImage, subject - 3, subject + 12);
    assert.ok(center - halfView >= -halfImage - 1e-9);
    assert.ok(center + halfView <= halfImage + 1e-9);
  }
});

test('camera still follows the full character when there is room inside the image', () => {
  const center = constrainCameraAxis(0, 15, 60, 25, 35);
  assert.ok(center - 15 <= 25);
  assert.ok(center + 15 >= 35);
});
