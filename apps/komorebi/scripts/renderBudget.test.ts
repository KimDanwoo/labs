import assert from 'node:assert/strict';
import test from 'node:test';
import { nextRenderTime, renderPixelRatio, shouldRenderFrame } from '../src/features/walk/lib/renderBudget';

test('large Retina displays stay within the pixel budget without changing layout', () => {
  for (const [width, height, density] of [
    [1440, 1000, 2],
    [3840, 2160, 2],
    [390, 844, 3],
  ]) {
    const ratio = renderPixelRatio(width!, height!, density!, false);
    assert.ok(width! * height! * ratio * ratio <= 2_400_001);
    assert.ok(ratio <= density!);
  }
  assert.equal(renderPixelRatio(390, 844, 3, true), 1.5);
  assert.equal(renderPixelRatio(1280, 720, 1, false), 1);
});

test('movement follows every display refresh while idle rendering stays at 30 Hz', () => {
  for (const active of [false, true]) {
    for (const refresh of [30, 60, 90, 120, 144, 165]) {
      let next = 0;
      let rendered = 0;
      for (let frame = 0; frame < refresh * 10; frame++) {
        const time = (frame * 1000) / refresh;
        if (!shouldRenderFrame(time, next, active)) continue;
        next = active ? time : nextRenderTime(Math.max(time, next), next);
        rendered++;
      }
      assert.ok(Math.abs(rendered - (active ? refresh : 30) * 10) <= 1, `${refresh} Hz: ${rendered}`);
    }
  }
});
