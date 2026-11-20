interface ChildFrame {
  pixels: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
  anchorX: number;
}

interface FrameBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const FRAME_ROWS = 4;
const FRAME_COLUMNS = 8;

function buildForeground(data: Uint8ClampedArray, width: number, height: number) {
  const foreground = new Uint8Array(width * height);
  for (let i = 0; i < foreground.length; i++) {
    const r = data[i * 4]!,
      g = data[i * 4 + 1]!,
      b = data[i * 4 + 2]!;
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 18 && Math.max(r, g, b) > 110;
    foreground[i] = Number(!neutral && data[i * 4 + 3]! > 80);
  }
  return foreground;
}

function rowCost(foreground: Uint8Array, width: number, y: number, expected: number) {
  let occupied = 0;
  for (let x = 0; x < width; x++) occupied += foreground[y * width + x]!;
  return occupied * 1000 + Math.abs(y - expected);
}

function findRowEdge(foreground: Uint8Array, width: number, height: number, row: number) {
  const expected = Math.round((row * height) / FRAME_ROWS);
  const radius = Math.max(1, Math.floor(height * 0.04));
  let best = expected,
    bestCost = Infinity;
  for (let y = expected - radius; y <= expected + radius; y++) {
    const cost = rowCost(foreground, width, y, expected);
    if (cost >= bestCost) continue;
    best = y;
    bestCost = cost;
  }
  return best;
}

function findRowEdges(foreground: Uint8Array, width: number, height: number) {
  const rowEdges = [0];
  for (let row = 1; row < FRAME_ROWS; row++) rowEdges.push(findRowEdge(foreground, width, height, row));
  rowEdges.push(height);
  return rowEdges;
}

function bestPreviousColumn(costs: Float64Array, span: number, y: number, x: number) {
  if (!y) return x;
  let previous = x;
  for (let dx = -1; dx <= 1; dx++) {
    const candidate = x + dx;
    if (candidate < 0 || candidate >= span) continue;
    if (costs[(y - 1) * span + candidate]! < costs[(y - 1) * span + previous]!) previous = candidate;
  }
  return previous;
}

function findSeam(foreground: Uint8Array, width: number, top: number, h: number, column: number) {
  const expected = width * (0.0718 + (column - 0.5) * 0.1235);
  const start = Math.max(1, Math.floor(expected - width * 0.022));
  const end = Math.min(width - 1, Math.ceil(expected + width * 0.022));
  const span = end - start + 1;
  const costs = new Float64Array(h * span);
  const parents = new Int32Array(h * span);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < span; x++) {
      const previous = bestPreviousColumn(costs, span, y, x);
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
  return seam;
}

function findSeams(foreground: Uint8Array, width: number, top: number, h: number) {
  const seams: Int32Array[] = [new Int32Array(h)];
  for (let column = 1; column < FRAME_COLUMNS; column++) seams.push(findSeam(foreground, width, top, h, column));
  seams.push(new Int32Array(h).fill(width));
  return seams;
}

function buildBody(
  foreground: Uint8Array,
  width: number,
  top: number,
  seams: { leftSeam: Int32Array; rightSeam: Int32Array },
  left: number,
  w: number,
  h: number,
) {
  const body = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = seams.leftSeam[y]!; x < seams.rightSeam[y]!; x++) {
      if (!foreground[(top + y) * width + x]) continue;
      body[y * w + x - left] = 1;
    }
  return body;
}

function measureBounds(
  body: Uint8Array,
  seams: { leftSeam: Int32Array; rightSeam: Int32Array },
  left: number,
  w: number,
  h: number,
): FrameBounds {
  const bounds = { minX: w, maxX: 0, minY: h, maxY: 0 };
  for (let y = 0; y < h; y++)
    for (let x = seams.leftSeam[y]!; x < seams.rightSeam[y]!; x++) {
      if (!body[y * w + x - left]) continue;
      bounds.minX = Math.min(bounds.minX, x - left);
      bounds.maxX = Math.max(bounds.maxX, x - left);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  return bounds;
}

function floodExterior(body: Uint8Array, w: number, h: number) {
  const exterior = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
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
  return exterior;
}

function hoodAnchor(body: Uint8Array, bounds: FrameBounds, w: number, frameHeight: number) {
  const { minX, maxX, minY } = bounds;
  let hoodLeft = w,
    hoodRight = 0;
  for (let y = minY; y < minY + Math.ceil(frameHeight * 0.5); y++)
    for (let x = minX; x <= maxX; x++) {
      if (!body[y * w + x]) continue;
      hoodLeft = Math.min(hoodLeft, x);
      hoodRight = Math.max(hoodRight, x);
    }
  return (hoodLeft + hoodRight) / 2 - minX;
}

function extractFrame(
  data: Uint8ClampedArray,
  foreground: Uint8Array,
  width: number,
  top: number,
  h: number,
  seams: { leftSeam: Int32Array; rightSeam: Int32Array },
  label: string,
): ChildFrame {
  const left = Math.min(...seams.leftSeam),
    right = Math.max(...seams.rightSeam),
    w = right - left;
  const body = buildBody(foreground, width, top, seams, left, w, h);
  // Keep the connected character before measuring its bounds and anchor;
  // otherwise a detached sliver survives and shifts the entire pose.
  keepLargestComponent(body, w);
  const bounds = measureBounds(body, seams, left, w, h);
  const { minX, maxX, minY, maxY } = bounds;
  if (minX > maxX || minY > maxY) throw new Error(`Empty character frame ${label}`);
  // Flood only the exterior matte: enclosed cream highlights remain opaque.
  const exterior = floodExterior(body, w, h);
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
  return { pixels, width: frameWidth, height: frameHeight, anchorX: hoodAnchor(body, bounds, w, frameHeight) };
}

/** Split the authored, unevenly spaced sheet at background seams before resizing.
 * A fixed grid (or resizing into a narrow canvas first) clips the wide hoods.
 */
export function extractChildFrames(data: Uint8ClampedArray, width: number, height: number) {
  const foreground = buildForeground(data, width, height);
  // Authored soles can extend below the nominal row boundary. Split in the
  // empty gutter instead of cutting every row at exactly one quarter height.
  const rowEdges = findRowEdges(foreground, width, height);
  const frames: ChildFrame[] = [];
  for (let row = 0; row < FRAME_ROWS; row++) {
    const top = rowEdges[row]!;
    const h = rowEdges[row + 1]! - top;
    const seams = findSeams(foreground, width, top, h);
    for (let column = 0; column < FRAME_COLUMNS; column++) {
      const pair = { leftSeam: seams[column]!, rightSeam: seams[column + 1]! };
      frames.push(extractFrame(data, foreground, width, top, h, pair, `${row}:${column}`));
    }
  }
  return frames;
}

function neighborIndices(index: number, width: number, height: number) {
  const x = index % width,
    y = Math.floor(index / width);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      result.push(ny * width + nx);
    }
  return result;
}

function floodComponent(
  mask: Uint8Array,
  labels: Int32Array,
  queue: Int32Array,
  start: number,
  label: number,
  width: number,
) {
  const height = mask.length / width;
  let read = 0,
    write = 1;
  queue[0] = start;
  labels[start] = label;
  while (read < write) {
    for (const next of neighborIndices(queue[read++]!, width, height)) {
      if (!mask[next] || labels[next]) continue;
      labels[next] = label;
      queue[write++] = next;
    }
  }
  return write;
}

function keepLargestComponent(mask: Uint8Array, width: number) {
  const labels = new Int32Array(mask.length);
  const queue = new Int32Array(mask.length);
  let label = 0,
    largestLabel = 0,
    largestSize = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue;
    label++;
    const size = floodComponent(mask, labels, queue, start, label, width);
    if (size > largestSize) {
      largestSize = size;
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
