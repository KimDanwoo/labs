/** Split the authored, unevenly spaced sheet at background seams before resizing.
 * A fixed grid (or resizing into a narrow canvas first) clips the wide hoods.
 */
export function extractChildFrames(data: Uint8ClampedArray, width: number, height: number) {
  const foreground = new Uint8Array(width * height);
  for (let i = 0; i < foreground.length; i++) {
    const r = data[i * 4]!,
      g = data[i * 4 + 1]!,
      b = data[i * 4 + 2]!;
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 18 && Math.max(r, g, b) > 110;
    foreground[i] = Number(!neutral && data[i * 4 + 3]! > 80);
  }
  // Authored soles can extend below the nominal row boundary. Split in the
  // empty gutter instead of cutting every row at exactly one quarter height.
  const rowEdges = [0];
  for (let row = 1; row < 4; row++) {
    const expected = Math.round((row * height) / 4);
    const radius = Math.max(1, Math.floor(height * 0.04));
    let best = expected,
      bestCost = Infinity;
    for (let y = expected - radius; y <= expected + radius; y++) {
      let occupied = 0;
      for (let x = 0; x < width; x++) occupied += foreground[y * width + x]!;
      const cost = occupied * 1000 + Math.abs(y - expected);
      if (cost < bestCost) {
        best = y;
        bestCost = cost;
      }
    }
    rowEdges.push(best);
  }
  rowEdges.push(height);
  const frames = [];
  for (let row = 0; row < 4; row++) {
    const top = rowEdges[row]!,
      bottom = rowEdges[row + 1]!;
    const h = bottom - top;
    // Minimum-cost seams bend around the outlines where neighbouring hoods touch.
    const seams: Int32Array[] = [new Int32Array(h)];
    for (let column = 1; column < 8; column++) {
      const expected = width * (0.0718 + (column - 0.5) * 0.1235);
      const start = Math.max(1, Math.floor(expected - width * 0.022));
      const end = Math.min(width - 1, Math.ceil(expected + width * 0.022));
      const span = end - start + 1;
      const costs = new Float64Array(h * span);
      const parents = new Int32Array(h * span);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < span; x++) {
          let previous = x;
          if (y) {
            for (let dx = -1; dx <= 1; dx++) {
              const candidate = x + dx;
              if (
                candidate >= 0 &&
                candidate < span &&
                costs[(y - 1) * span + candidate]! < costs[(y - 1) * span + previous]!
              )
                previous = candidate;
            }
          }
          const cost = foreground[(top + y) * width + start + x]! * 1000 + Math.abs(start + x - expected) * 0.01;
          costs[y * span + x] = cost + (y ? costs[(y - 1) * span + previous]! : 0);
          parents[y * span + x] = previous;
        }
      }
      let x = 0;
      for (let i = 1; i < span; i++) if (costs[(h - 1) * span + i]! < costs[(h - 1) * span + x]!) x = i;
      const seam = new Int32Array(h);
      for (let y = h - 1; y >= 0; y--) {
        seam[y] = start + x;
        x = parents[y * span + x]!;
      }
      seams.push(seam);
    }
    seams.push(new Int32Array(h).fill(width));
    for (let column = 0; column < 8; column++) {
      const leftSeam = seams[column]!,
        rightSeam = seams[column + 1]!;
      const left = Math.min(...leftSeam),
        right = Math.max(...rightSeam),
        w = right - left;
      const body = new Uint8Array(w * h);
      const exterior = new Uint8Array(w * h);
      const queue = new Int32Array(w * h);
      let minX = w,
        maxX = 0,
        minY = h,
        maxY = 0;
      for (let y = 0; y < h; y++)
        for (let x = leftSeam[y]!; x < rightSeam[y]!; x++) {
          if (!foreground[(top + y) * width + x]) continue;
          body[y * w + x - left] = 1;
        }
      // A neighbouring row's toe or hat can cross the authored cell boundary.
      // Keep the connected character before measuring its bounds and anchor;
      // otherwise a detached sliver survives and shifts the entire pose.
      keepLargestComponent(body, w, h);
      for (let y = 0; y < h; y++)
        for (let x = leftSeam[y]!; x < rightSeam[y]!; x++) {
          if (!body[y * w + x - left]) continue;
          minX = Math.min(minX, x - left);
          maxX = Math.max(maxX, x - left);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      if (minX > maxX || minY > maxY) throw new Error(`Empty character frame ${row}:${column}`);
      // Flood only the exterior matte: enclosed cream highlights remain opaque.
      let read = 0,
        write = 0;
      const seed = (i: number) => {
        if (!body[i] && !exterior[i]) {
          exterior[i] = 1;
          queue[write++] = i;
        }
      };
      for (let x = 0; x < w; x++) {
        seed(x);
        seed((h - 1) * w + x);
      }
      for (let y = 0; y < h; y++) {
        seed(y * w);
        seed(y * w + w - 1);
      }
      while (read < write) {
        const i = queue[read++]!;
        if (i % w) seed(i - 1);
        if (i % w < w - 1) seed(i + 1);
        if (i >= w) seed(i - w);
        if (i < w * (h - 1)) seed(i + w);
      }
      const frameWidth = maxX - minX + 1,
        frameHeight = maxY - minY + 1;
      const pixels = new Uint8ClampedArray(frameWidth * frameHeight * 4);
      for (let y = minY; y <= maxY; y++)
        for (let x = minX; x <= maxX; x++) {
          if (exterior[y * w + x]) continue;
          const source = ((top + y) * width + left + x) * 4;
          pixels.set(data.subarray(source, source + 4), ((y - minY) * frameWidth + x - minX) * 4);
        }
      // Anchor the hood, not the changing reach of a swinging foot or hand.
      let hoodLeft = w,
        hoodRight = 0;
      for (let y = minY; y < minY + Math.ceil(frameHeight * 0.5); y++)
        for (let x = minX; x <= maxX; x++) {
          if (body[y * w + x]) {
            hoodLeft = Math.min(hoodLeft, x);
            hoodRight = Math.max(hoodRight, x);
          }
        }
      frames.push({ pixels, width: frameWidth, height: frameHeight, anchorX: (hoodLeft + hoodRight) / 2 - minX });
    }
  }
  return frames;
}

function keepLargestComponent(mask: Uint8Array, width: number, height: number) {
  const labels = new Int32Array(mask.length);
  const queue = new Int32Array(mask.length);
  let label = 0,
    largestLabel = 0,
    largestSize = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue;
    label++;
    let read = 0,
      write = 1;
    queue[0] = start;
    labels[start] = label;
    while (read < write) {
      const index = queue[read++]!;
      const x = index % width,
        y = Math.floor(index / width);
      // Diagonal ink strokes belong to the same outlined character.
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (!mask[next] || labels[next]) continue;
          labels[next] = label;
          queue[write++] = next;
        }
    }
    if (write > largestSize) {
      largestSize = write;
      largestLabel = label;
    }
  }
  for (let i = 0; i < mask.length; i++) mask[i] = Number(largestLabel > 0 && labels[i] === largestLabel);
}

/** Screen-down is front, screen-right is right, screen-up is back. */
export function childFacing(previous: number, heading: number) {
  const previousAngle = (previous * Math.PI) / 2;
  const delta = Math.atan2(Math.sin(heading - previousAngle), Math.cos(heading - previousAngle));
  if (Math.abs(delta) <= Math.PI / 4 + 0.12) return previous;
  return ((Math.round(heading / (Math.PI / 2)) % 4) + 4) % 4;
}
