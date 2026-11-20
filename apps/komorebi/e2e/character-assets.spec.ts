import { expect, test } from '@playwright/test';
import {
  CHARACTER,
  CHARACTER_RIG,
  OUTFIT,
  OUTFIT_DEFINITIONS,
  characterLayers,
} from '../src/views/walk/model/world/appearance';

test('body atlases keep every pose on the shared foot anchor and leave the costume region empty', async ({ page }) => {
  await page.goto('/404.html');
  const sources = Object.values(CHARACTER).map((character) => characterLayers({ character, outfit: OUTFIT.summer }));
  const reports = await page.evaluate(
    async ({ sources, rig }) => {
      const OPAQUE_ALPHA = 128;
      const frameWidth = rig.width / rig.columns;
      const frameHeight = rig.height / rig.rows;
      const loadPixels = async (source: string) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, image.width, image.height);
        return { data, width: image.width, height: image.height };
      };
      const frameBottom = (data: Uint8ClampedArray, width: number, row: number, column: number) => {
        let bottom = -1;
        for (let y = 0; y < frameHeight; y++) {
          for (let x = 0; x < frameWidth; x++) {
            const alpha = data[((row * frameHeight + y) * width + column * frameWidth + x) * 4 + 3];
            const isOpaque = alpha !== undefined && alpha > OPAQUE_ALPHA;
            if (isOpaque) bottom = y;
          }
        }
        return bottom;
      };
      const costumeRegionAlpha = (data: Uint8ClampedArray, width: number) => {
        let costumeAlpha = 0;
        for (let y = 198; y < 206; y++) {
          for (let x = 72; x < 121; x++) {
            costumeAlpha = Math.max(costumeAlpha, data[(y * width + x) * 4 + 3] ?? 0);
          }
        }
        return costumeAlpha;
      };
      const measure = async ({ body: source, bodyPoseOffsets }: (typeof sources)[number]) => {
        const { data, width, height } = await loadPixels(source);
        const bottoms: number[] = [];
        for (let row = 0; row < rig.rows; row++) {
          for (let column = 0; column < rig.columns; column++) {
            const pose = row * rig.columns + column;
            bottoms.push(frameBottom(data, width, row, column) + (bodyPoseOffsets[pose] ?? 0));
          }
        }
        return { source, width, height, bottoms, costumeAlpha: costumeRegionAlpha(data, width) };
      };
      const results = [];
      for (const entry of sources) results.push(await measure(entry));
      return results;
    },
    { sources, rig: CHARACTER_RIG },
  );
  const footAnchor = CHARACTER_RIG.height / CHARACTER_RIG.rows - CHARACTER_RIG.footInset;
  const ANTI_ALIAS_MARGIN = 5;
  const EMPTY_ALPHA_LIMIT = 32;
  for (const report of reports) {
    expect(report.width, report.source).toBe(CHARACTER_RIG.width);
    expect(report.height, report.source).toBe(CHARACTER_RIG.height);
    report.bottoms.forEach((bottom, frame) => {
      expect(bottom, `${report.source}, pose ${frame}`).toBeGreaterThanOrEqual(footAnchor - ANTI_ALIAS_MARGIN);
      expect(bottom, `${report.source}, pose ${frame}`).toBeLessThanOrEqual(footAnchor + ANTI_ALIAS_MARGIN);
    });
    expect(report.costumeAlpha, `${report.source} contains old clothing in the costume region`).toBeLessThanOrEqual(
      EMPTY_ALPHA_LIMIT,
    );
  }
});

test('the shared PE uniform retains all 32 garment poses and transparent space around them', async ({ page }) => {
  await page.goto('/404.html');
  const reports = await page.evaluate(
    async ({ sources, rig }) => {
      const OPAQUE_ALPHA = 128;
      const OUTSIDE_TOP = 120;
      const OUTSIDE_BOTTOM = 240;
      const width = rig.width / rig.columns;
      const height = rig.height / rig.rows;
      const loadPixels = async (source: string) => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, image.width, image.height);
        return { data, width: image.width, height: image.height };
      };
      const frameBounds = (data: Uint8ClampedArray, imageWidth: number, row: number, column: number) => {
        let left = width,
          top = height,
          right = -1,
          bottom = -1,
          outsideAlpha = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = data[((row * height + y) * imageWidth + column * width + x) * 4 + 3] ?? 0;
            if (alpha > OPAQUE_ALPHA) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
            const isOutsideBand = y < OUTSIDE_TOP || y > OUTSIDE_BOTTOM;
            if (isOutsideBand) outsideAlpha = Math.max(outsideAlpha, alpha);
          }
        }
        return { bounds: [left, top, right, bottom], outsideAlpha };
      };
      const measure = async (source: string) => {
        const pixels = await loadPixels(source);
        const bounds: number[][] = [];
        let outsideAlpha = 0;
        for (let row = 0; row < rig.rows; row++) {
          for (let column = 0; column < rig.columns; column++) {
            const frame = frameBounds(pixels.data, pixels.width, row, column);
            bounds.push(frame.bounds);
            outsideAlpha = Math.max(outsideAlpha, frame.outsideAlpha);
          }
        }
        return { width: pixels.width, height: pixels.height, bounds, outsideAlpha };
      };
      const reports = [];
      for (const source of sources) reports.push(await measure(source));
      return reports;
    },
    { sources: [OUTFIT_DEFINITIONS[OUTFIT.summer].atlas, OUTFIT_DEFINITIONS[OUTFIT.pe].atlas], rig: CHARACTER_RIG },
  );
  const [summer, pe] = reports;
  expect(summer).toBeDefined();
  expect(pe).toBeDefined();
  if (!summer) return;
  if (!pe) return;
  expect(pe.width).toBe(CHARACTER_RIG.width);
  expect(pe.height).toBe(CHARACTER_RIG.height);
  expect(pe.outsideAlpha).toBeLessThan(16);
  expect(pe.bounds).toHaveLength(32);
  pe.bounds.forEach((bounds, pose) =>
    bounds.forEach((coordinate, edge) => {
      const reference = summer.bounds[pose]?.[edge];
      expect(reference).toBeDefined();
      if (reference !== undefined)
        expect(Math.abs(coordinate - reference), `PE uniform drifted in pose ${pose}`).toBeLessThanOrEqual(4);
    }),
  );
});

test('side-facing idle feet point toward the face instead of keeping two front-facing shoes', async ({ page }) => {
  await page.goto('/404.html');
  const sources = Object.values(CHARACTER).map(
    (character) => characterLayers({ character, outfit: OUTFIT.summer }).body,
  );
  const reports = await page.evaluate(async (sources) => {
    const FRAME_HEIGHT = 256;
    const loadPixels = async (source: string) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, image.width, image.height);
      return { data, width: image.width };
    };
    const isShoe = (r: number, g: number, b: number) => r > 150 && g > 100 && b < 110;
    const isSock = (r: number, g: number, b: number) => r > 180 && g > 180 && b > 170;
    const centroidX = (
      data: Uint8ClampedArray,
      width: number,
      row: number,
      matches: (r: number, g: number, b: number) => boolean,
    ) => {
      let count = 0,
        sum = 0;
      for (let y = 210; y < 253; y++)
        for (let x = 45; x < 145; x++) {
          const index = ((row * FRAME_HEIGHT + y) * width + x) * 4;
          if ((data[index + 3] ?? 0) < 180) continue;
          if (!matches(data[index] ?? 0, data[index + 1] ?? 0, data[index + 2] ?? 0)) continue;
          count++;
          sum += x;
        }
      return { count, mean: sum / count };
    };
    const profileToeOffset = (data: Uint8ClampedArray, width: number, row: number, source: string) => {
      const shoes = centroidX(data, width, row, isShoe);
      const socks = centroidX(data, width, row, isSock);
      if (!shoes.count) throw new Error(`Missing profile shoes in ${source}`);
      if (!socks.count) throw new Error(`Missing profile shoes in ${source}`);
      return shoes.mean - socks.mean;
    };
    const results: { source: string; direction: number; toeOffset: number }[] = [];
    for (const source of sources) {
      const { data, width } = await loadPixels(source);
      for (const row of [1, 3]) {
        results.push({ source, direction: row === 1 ? 1 : -1, toeOffset: profileToeOffset(data, width, row, source) });
      }
    }
    return results;
  }, sources);
  for (const report of reports) expect(report.toeOffset * report.direction, report.source).toBeGreaterThan(2);
});
