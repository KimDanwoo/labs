import assert from 'node:assert/strict';
import test from 'node:test';
import { childFacing, extractChildFrames } from '../src/features/walk/lib/atlas';

test('front/back reversals select the destination artwork without an intermediate side pose', () => {
  assert.equal(childFacing(0, Math.PI), 2);
  assert.equal(childFacing(2, 0), 0);
  assert.equal(childFacing(0, Math.atan2(1, 0)), 1);
  assert.equal(childFacing(0, Math.atan2(-1, 0)), 3);
  assert.equal(childFacing(1, -Math.PI / 2), 3);
});

test('diagonal jitter retains the current facing until the dead band is crossed', () => {
  assert.equal(childFacing(0, Math.PI / 4 + 0.05), 0);
  assert.equal(childFacing(0, Math.PI / 4 + 0.2), 1);
  assert.equal(childFacing(3, (3 * Math.PI) / 2), 3);
});

test('uneven wide frames retain both edges and enclosed neutral highlights', () => {
  const width = 800,
    height = 400;
  const pixels = new Uint8ClampedArray(width * height * 4).fill(240);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 8; column++) {
      const center = Math.round(width * (0.0718 + column * 0.1235));
      for (let y = row * 100 + 15; y < row * 100 + 85; y++)
        for (let x = center - 42; x <= Math.min(width - 1, center + 42); x++) {
          const i = (y * width + x) * 4;
          pixels.set([80, 50, 30, 255], i);
        }
      pixels.set([230, 230, 230, 255], ((row * 100 + 40) * width + center) * 4);
    }
  const frames = extractChildFrames(pixels, width, height);
  assert.equal(frames.length, 32);
  for (const frame of frames) {
    assert.equal(frame.width, 85);
    assert.equal(frame.height, 70);
    assert.equal(frame.pixels[(25 * frame.width + 42) * 4 + 3], 255);
    assert.equal(frame.pixels[3], 255);
    assert.equal(frame.pixels[(frame.width - 1) * 4 + 3], 255);
  }
});

test('neighbouring row fragments cannot survive extraction or move the character anchor', () => {
  const width = 800,
    height = 400;
  const pixels = new Uint8ClampedArray(width * height * 4);
  const paint = (x: number, y: number) => pixels.set([80, 50, 30, 255], (y * width + x) * 4);
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 8; column++) {
      const center = Math.round(width * (0.0718 + column * 0.1235));
      for (let y = 20; y < 90; y++) for (let x = center - 30; x <= center + 30; x++) paint(x, row * 100 + y);
      // A detached shoe from the row above, offset to bias the old head anchor.
      for (let y = 0; y < 3; y++) for (let x = center + 34; x <= center + 40; x++) paint(x, row * 100 + y);
    }
  const frames = extractChildFrames(pixels, width, height);
  for (const frame of frames) {
    assert.equal(frame.width, 61);
    assert.equal(frame.height, 70);
    assert.equal(frame.anchorX, 30);
    assert.equal(frame.pixels[3], 255);
  }
});

test('soles crossing a nominal row boundary remain whole without entering the next pose', () => {
  const width = 800,
    height = 400;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 8; column++) {
      const center = Math.round(width * (0.0718 + column * 0.1235));
      const bottom = row === 0 ? 105 : row * 100 + 90;
      for (let y = row * 100 + 20; y < bottom; y++)
        for (let x = center - 30; x <= center + 30; x++) pixels.set([80, 50, 30, 255], (y * width + x) * 4);
    }
  const frames = extractChildFrames(pixels, width, height);
  for (const [index, frame] of frames.entries()) {
    assert.equal(frame.height, index < 8 ? 85 : 70);
    assert.equal(frame.width, 61);
    assert.equal(frame.pixels[((frame.height - 1) * frame.width + 30) * 4 + 3], 255);
  }
});
