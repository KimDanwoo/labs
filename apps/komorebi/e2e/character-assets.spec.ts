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
      const results: { source: string; width: number; height: number; bottoms: number[]; costumeAlpha: number }[] = [];
      const frameWidth = rig.width / rig.columns;
      const frameHeight = rig.height / rig.rows;
      const OPAQUE_ALPHA = 128;
      for (const { body: source, bodyPoseOffsets } of sources) {
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
        const bottoms: number[] = [];
        for (let row = 0; row < rig.rows; row++) {
          for (let column = 0; column < rig.columns; column++) {
            let bottom = -1;
            for (let y = 0; y < frameHeight; y++) {
              for (let x = 0; x < frameWidth; x++) {
                const alpha = data[((row * frameHeight + y) * image.width + column * frameWidth + x) * 4 + 3];
                if (alpha !== undefined && alpha > OPAQUE_ALPHA) bottom = y;
              }
            }
            const pose = row * rig.columns + column;
            bottoms.push(bottom + (bodyPoseOffsets[pose] ?? 0));
          }
        }
        let costumeAlpha = 0;
        for (let y = 198; y < 206; y++) {
          for (let x = 72; x < 121; x++) {
            costumeAlpha = Math.max(costumeAlpha, data[(y * image.width + x) * 4 + 3] ?? 0);
          }
        }
        results.push({ source, width: image.width, height: image.height, bottoms, costumeAlpha });
      }
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
      const reports: { width: number; height: number; bounds: number[][]; outsideAlpha: number }[] = [];
      for (const source of sources) {
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
        const width = rig.width / rig.columns;
        const height = rig.height / rig.rows;
        const bounds: number[][] = [];
        let outsideAlpha = 0;
        for (let row = 0; row < rig.rows; row++) {
          for (let column = 0; column < rig.columns; column++) {
            let left = width,
              top = height,
              right = -1,
              bottom = -1;
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const alpha = data[((row * height + y) * image.width + column * width + x) * 4 + 3] ?? 0;
                if (alpha > 128) {
                  left = Math.min(left, x);
                  top = Math.min(top, y);
                  right = Math.max(right, x);
                  bottom = Math.max(bottom, y);
                }
                if (y < 120 || y > 240) outsideAlpha = Math.max(outsideAlpha, alpha);
              }
            }
            bounds.push([left, top, right, bottom]);
          }
        }
        reports.push({ width: image.width, height: image.height, bounds, outsideAlpha });
      }
      return reports;
    },
    { sources: [OUTFIT_DEFINITIONS[OUTFIT.summer].atlas, OUTFIT_DEFINITIONS[OUTFIT.pe].atlas], rig: CHARACTER_RIG },
  );
  const [summer, pe] = reports;
  expect(summer).toBeDefined();
  expect(pe).toBeDefined();
  if (!summer || !pe) return;
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
    const results: { source: string; direction: number; toeOffset: number }[] = [];
    for (const source of sources) {
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
      for (const row of [1, 3]) {
        let shoes = 0,
          shoeX = 0,
          socks = 0,
          sockX = 0;
        for (let y = 210; y < 253; y++)
          for (let x = 45; x < 145; x++) {
            const index = ((row * 256 + y) * image.width + x) * 4;
            const r = data[index] ?? 0,
              g = data[index + 1] ?? 0,
              b = data[index + 2] ?? 0,
              alpha = data[index + 3] ?? 0;
            if (alpha < 180) continue;
            if (r > 150 && g > 100 && b < 110) {
              shoes++;
              shoeX += x;
            }
            if (r > 180 && g > 180 && b > 170) {
              socks++;
              sockX += x;
            }
          }
        if (!shoes || !socks) throw new Error(`Missing profile shoes in ${source}`);
        results.push({ source, direction: row === 1 ? 1 : -1, toeOffset: shoeX / shoes - sockX / socks });
      }
    }
    return results;
  }, sources);
  for (const report of reports) expect(report.toeOffset * report.direction, report.source).toBeGreaterThan(2);
});
