import assert from 'node:assert/strict';
import test from 'node:test';
import { childFacing, extractChildFrames } from '../atlas';

const INK: [number, number, number, number] = [80, 50, 30, 255];

const forEachCell = (width: number, visit: (row: number, center: number) => void) => {
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 8; column++) visit(row, Math.round(width * (0.0718 + column * 0.1235)));
};

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const fillRect = (pixels: Uint8ClampedArray, width: number, rect: Rect, color: ArrayLike<number> = INK) => {
  for (let y = rect.top; y < rect.bottom; y++)
    for (let x = rect.left; x <= rect.right; x++) pixels.set(color, (y * width + x) * 4);
};

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
  forEachCell(width, (row, center) => {
    const rect = {
      left: center - 42,
      right: Math.min(width - 1, center + 42),
      top: row * 100 + 15,
      bottom: row * 100 + 85,
    };
    fillRect(pixels, width, rect);
    pixels.set([230, 230, 230, 255], ((row * 100 + 40) * width + center) * 4);
  });
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
  forEachCell(width, (row, center) => {
    fillRect(pixels, width, { left: center - 30, right: center + 30, top: row * 100 + 20, bottom: row * 100 + 90 });
    fillRect(pixels, width, { left: center + 34, right: center + 40, top: row * 100, bottom: row * 100 + 3 });
  });
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
  forEachCell(width, (row, center) => {
    const bottom = row === 0 ? 105 : row * 100 + 90;
    fillRect(pixels, width, { left: center - 30, right: center + 30, top: row * 100 + 20, bottom });
  });
  const frames = extractChildFrames(pixels, width, height);
  for (const [index, frame] of frames.entries()) {
    assert.equal(frame.height, index < 8 ? 85 : 70);
    assert.equal(frame.width, 61);
    assert.equal(frame.pixels[((frame.height - 1) * frame.width + 30) * 4 + 3], 255);
  }
});
