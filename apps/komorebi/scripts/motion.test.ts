import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceMotion, angleDelta, createMotion, solveLeg } from '../src/features/walk/lib/motion';

test('turning across the angle seam takes the short route', () => {
  const m = createMotion();
  m.heading = Math.PI - 0.05;
  const target = -Math.PI + 0.05;
  assert.ok(Math.abs(angleDelta(m.heading, target) - 0.1) < 1e-8);
  advanceMotion(m, 1 / 60, 0.1, target, false, true);
  assert.ok(m.heading > Math.PI - 0.05 && m.heading < Math.PI + 0.05);
});
test('gait follows distance at 30 and 120 fps and does not reset when running changes', () => {
  const slow = createMotion(),
    fast = createMotion();
  for (let i = 0; i < 30; i++) advanceMotion(slow, 1 / 30, 9 / 30, 0, false, true);
  for (let i = 0; i < 120; i++) advanceMotion(fast, 1 / 120, 9 / 120, 0, false, true);
  assert.ok(Math.abs(slow.phase - fast.phase) < 1e-8);
  const phase = slow.phase;
  advanceMotion(slow, 1 / 60, 0, 0, true, false);
  assert.equal(slow.phase, phase);
});
test('stopping settles the pose without moving the gait phase', () => {
  const m = createMotion();
  advanceMotion(m, 0.2, 1, 1, true, true);
  const phase = m.phase;
  for (let i = 0; i < 60; i++) advanceMotion(m, 1 / 60, 0, 1, false, false);
  assert.equal(m.phase, phase);
  assert.ok(m.energy < 0.001);
  assert.ok(m.run < 0.001);
});
test('leg joints put a reachable planted foot on the ground with a level sole', () => {
  for (const forward of [-0.4, 0, 0.4]) {
    const p = solveLeg(forward, 0);
    const y = 1.62 - 0.72 * Math.cos(p.hip) - 0.73 * Math.cos(p.hip + p.knee);
    const z = -0.72 * Math.sin(p.hip) - 0.73 * Math.sin(p.hip + p.knee);
    assert.ok(Math.abs(y - 0.24) < 1e-8);
    assert.ok(Math.abs(z - forward) < 1e-8);
    assert.ok(Math.abs(p.hip + p.knee + p.ankle) < 1e-8);
  }
});

test('jump has a consistent apex, cannot double-jump, and lands back at ground height', async () => {
  const { createJump, startJump, advanceJump } = await import('../src/features/walk/lib/motion');
  for (const fps of [30, 60, 120]) {
    const jump = createJump();
    assert.ok(startJump(jump));
    assert.equal(startJump(jump), false);
    let highest = 0;
    let airborneFrames = 0;
    for (let i = 0; i < fps; i++) {
      advanceJump(jump, 1 / fps);
      highest = Math.max(highest, jump.height);
      if (jump.height > 0) airborneFrames++;
    }
    assert.ok(Math.abs(highest - 0.8) < 0.01);
    assert.ok(Math.abs(airborneFrames / fps - 0.4) <= 1 / fps + 1e-8);
    assert.equal(jump.height, 0);
    assert.equal(jump.velocity, 0);
    assert.ok(startJump(jump));
  }
});

test('planted foot cancels forward travel and recovery clears the ground', async () => {
  const { footCycle } = await import('../src/features/walk/lib/motion');
  for (const run of [0, 0.5, 1]) {
    const stance = 0.6 - run * 0.22;
    const cycle = 3.8 + run * 1.3;
    const a = footCycle(0.1 * Math.PI * 2, run);
    const b = footCycle(0.2 * Math.PI * 2, run);
    assert.ok(a.planted && b.planted);
    assert.equal(a.lift, 0);
    assert.ok(Math.abs((b.along - a.along) * cycle * stance + 0.1 * cycle) < 1e-8);
    const recovery = footCycle((stance + (1 - stance) / 2) * Math.PI * 2, run);
    assert.ok(!recovery.planted && recovery.lift > 0.99);
  }
});

test('a footfall lands each time the gait passes half a cycle, never twice for one crossing', async () => {
  const { crossedFootfall, isAirborne, startJump, createJump } = await import('../src/features/walk/lib/motion');
  assert.equal(crossedFootfall(0.1, 0.2), false);
  assert.equal(crossedFootfall(Math.PI - 0.01, Math.PI + 0.01), true);
  assert.equal(crossedFootfall(Math.PI + 0.01, Math.PI + 0.02), false);
  assert.equal(crossedFootfall(2 * Math.PI - 0.1, 2 * Math.PI + 0.1), true);
  const jump = createJump();
  assert.equal(isAirborne(jump), false);
  startJump(jump);
  assert.equal(isAirborne(jump), true, 'airborne from the take-off frame, before height rises');
});
