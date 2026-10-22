import { extractChildFrames } from '../src/features/walk/lib/atlas';

/** Bake the original extraction and alignment once, instead of on every visit. */
export function prepareChildAtlas(source: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(source, 0, 0);
  const extracted = extractChildFrames(
    context.getImageData(0, 0, source.width, source.height).data,
    source.width,
    source.height,
  );
  // Extra transparent space protects swinging elbows and raised hands.
  const width = 192,
    height = 256,
    baseline = 249.5;
  // One shared scale preserves proportions and avoids frame-by-frame size pulsing.
  const maxRadius = Math.max(...extracted.map((f) => Math.max(f.anchorX, f.width - f.anchorX)));
  const scale = Math.min(
    height / (source.height / 4),
    (width / 2 - 6) / maxRadius,
    (baseline - 6) / Math.max(...extracted.map((f) => f.height)),
  );
  const sheet = document.createElement('canvas');
  sheet.width = width * 8;
  sheet.height = height * 4;
  const sheetContext = sheet.getContext('2d')!;
  extracted.forEach((f, index) => {
    const cell = document.createElement('canvas');
    cell.width = f.width;
    cell.height = f.height;
    cell.getContext('2d')!.putImageData(new ImageData(f.pixels, f.width, f.height), 0, 0);
    const aligned = document.createElement('canvas');
    aligned.width = width;
    aligned.height = height;
    const ctx = aligned.getContext('2d')!;
    const x = width / 2 - f.anchorX * scale;
    const y = baseline - f.height * scale;
    if (x < 5 || x + f.width * scale > width - 5 || y < 5 || y + f.height * scale > height - 5) {
      throw new Error(`Character pose ${index} does not fit with a safe margin`);
    }
    // Preserve the whole pose: raised hands may extend into the hood's height.
    ctx.drawImage(cell, x, y, f.width * scale, f.height * scale);
    sheetContext.drawImage(aligned, (index % 8) * width, Math.floor(index / 8) * height);
  });
  return sheet;
}
