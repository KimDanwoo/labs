import assert from 'node:assert/strict';
import test from 'node:test';
import { FOREGROUNDS, isForegroundInFront } from '../src/shared/world/foreground';
import type { Region } from '../src/shared/world/world';

function covered(region: Region, x: number, y: number, feetDepth: number) {
  return FOREGROUNDS.some((layer) => {
    if (!isForegroundInFront(layer, { x: x / 15.36, z: feetDepth }, region)) return false;
    let inside = false;
    for (let i = 0, j = layer.outline.length - 1; i < layer.outline.length; j = i++) {
      const [ax, ay] = layer.outline[i]!;
      const [bx, by] = layer.outline[j]!;
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  });
}

test('bridge rails hide the child while their openings preserve the visible body', () => {
  assert.ok(covered('river', 650, 495, 47.7));
  assert.ok(covered('river', 715, 510, 47.7));
  assert.equal(covered('river', 650, 510, 47.7), false);
  assert.equal(covered('river', 650, 475, 47.7), false);
  assert.ok(covered('village', 1350, 409, 42));
  assert.equal(covered('village', 1350, 425, 42), false);
});

test('foreground objects only cover characters behind them and in the same region', () => {
  assert.equal(covered('shops', 70, 580, 56), false);
  assert.equal(covered('shops', 140, 580, 56), false);
  assert.equal(covered('shops', 70, 580, 70), false);
  assert.equal(covered('school', 70, 580, 56), false);
  assert.equal(covered('river', 650, 495, 60), false);
});

test('the open harbour approach has no leftover guardrail occlusion', () => {
  for (let x = 270; x < 930; x += 20) {
    for (let y = 530; y < 620; y += 10) assert.equal(covered('coast', x, y, 55), false);
  }
  assert.ok(covered('coast', 1100, 580, 55));
});

test('coastal roadside fences never cover a character standing on the road in front', () => {
  for (const [x, feetY, headY] of [
    [975, 665, 570],
    [1100, 669, 580],
    [1400, 686, 590],
  ]) {
    assert.equal(covered('coast', x!, headY!, feetY! / 10.24), false);
  }
});

test('sloping village rails use local ground contact instead of the lowest post for the entire fence', () => {
  assert.equal(covered('village', 1450, 394, 440 / 10.24), false);
  assert.ok(covered('village', 1450, 394, 420 / 10.24));
  assert.equal(covered('village', 200, 440, 500 / 10.24), false);
});

test('every occluder switches at its own ground contact across its full width', () => {
  for (const layer of FOREGROUNDS) {
    const [[x1, y1], [x2, y2]] = layer.baseline;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const x = (x1 + (x2 - x1) * t) / 15.36;
      const y = y1 + (y2 - y1) * t;
      assert.equal(isForegroundInFront(layer, { x, z: (y + 1) / 10.24 }, layer.region), false);
      assert.equal(isForegroundInFront(layer, { x, z: (y - 1) / 10.24 }, layer.region), true);
    }
  }
});
