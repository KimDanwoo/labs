import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RENDER_RATE,
  nextRenderTime,
  renderPixelRatio,
  settle,
  shouldRenderFrame,
} from '../src/features/walk/lib/renderBudget';

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

function countRendered(refresh: number, rate: number, jitterMs = 0) {
  let next = 0;
  let rendered = 0;
  for (let frame = 0; frame < refresh * 10; frame++) {
    const jitter = frame % 2 ? jitterMs : -jitterMs;
    const time = (frame * 1000) / refresh + jitter;
    if (!shouldRenderFrame(time, next, rate)) continue;
    next = nextRenderTime(time, next, rate);
    rendered++;
  }
  return rendered / 10;
}

test('movement renders at up to 60 Hz on any display, never above it', () => {
  for (const refresh of [30, 60, 90, 120, 144, 165]) {
    const fps = countRendered(refresh, RENDER_RATE.active);
    assert.ok(fps <= RENDER_RATE.active + 0.1, `${refresh} Hz rendered ${fps}`);
    assert.ok(fps >= Math.min(refresh, RENDER_RATE.active) * 0.7, `${refresh} Hz rendered ${fps}`);
  }
  assert.ok(countRendered(120, RENDER_RATE.active) >= 59, '120 Hz halves cleanly to 60');
  assert.ok(countRendered(60, RENDER_RATE.active, 0.8) >= 59, 'timestamp jitter does not drop 60 Hz frames');
});

test('idle scenery renders at 30 Hz on any display', () => {
  for (const refresh of [30, 60, 90, 120, 144, 165]) {
    const fps = countRendered(refresh, RENDER_RATE.idle);
    assert.ok(fps <= RENDER_RATE.idle + 0.1 && fps >= RENDER_RATE.idle * 0.7, `${refresh} Hz rendered ${fps}`);
  }
});

test('a frame after a long stall schedules from now instead of bursting to catch up', () => {
  const next = nextRenderTime(5_000, 100, RENDER_RATE.active);
  assert.ok(next > 5_000 && next <= 5_000 + 1000 / RENDER_RATE.active);
});

test('settle snaps only when the gap is within tolerance', () => {
  assert.equal(settle(1.004, 1, 0.01), 1);
  assert.equal(settle(1.5, 1, 0.01), 1.5);
});
