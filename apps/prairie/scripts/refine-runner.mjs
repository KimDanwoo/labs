// CC0 원본의 리그·애니메이션을 보존하고 Loop subdivision으로 곡면을 굽는다.
// 실행: node scripts/refine-runner.mjs (prairie 디렉토리에서)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = readFileSync(new URL('../public/models/runner.glb', import.meta.url));
const jsonLength = source.readUInt32LE(12);
const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const binaryStart = 28 + jsonLength;
const binary = source.subarray(binaryStart);
const READ = { 5123: ['readUInt16LE', 2], 5125: ['readUInt32LE', 4], 5126: ['readFloatLE', 4] };
const SIZE = { SCALAR: 1, VEC3: 3, VEC4: 4 };

function readAccessor(index) {
  const a = gltf.accessors[index];
  const view = gltf.bufferViews[a.bufferView];
  const [method, bytes] = READ[a.componentType];
  const width = SIZE[a.type];
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: width }, (_, c) =>
      binary[method]((view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (view.byteStride ?? width * bytes) + c * bytes),
    ),
  );
}

function blendWeights(vertices, stencil) {
  const combined = new Map();
  for (const [index, amount] of stencil) {
    for (const [joint, weight] of vertices[index].skin)
      combined.set(joint, (combined.get(joint) ?? 0) + weight * amount);
  }
  const skin = [...combined]
    .filter(([, w]) => w > 1e-8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const sum = skin.reduce((n, [, w]) => n + w, 0);
  return skin.map(([j, w]) => [j, w / sum]);
}

function interpolate(vertices, stencil) {
  const position = [0, 0, 0];
  for (const [index, amount] of stencil)
    vertices[index].position.forEach((v, axis) => {
      position[axis] += v * amount;
    });
  return { position, skin: blendWeights(vertices, stencil) };
}

let vertices = [];
let faces = [];
const welded = new Map();
for (const primitive of gltf.meshes[0].primitives) {
  const positions = readAccessor(primitive.attributes.POSITION);
  const joints = readAccessor(primitive.attributes.JOINTS_0);
  const weights = readAccessor(primitive.attributes.WEIGHTS_0);
  const indices = readAccessor(primitive.indices).flat();
  const map = positions.map((position, i) => {
    const skin = joints[i]
      .map((j, k) => [j, weights[i][k]])
      .filter(([, w]) => w > 1e-8)
      .sort((a, b) => a[0] - b[0]);
    const key = position.map((v) => v.toFixed(7)).join(',');
    if (!welded.has(key)) {
      welded.set(key, vertices.length);
      vertices.push({ position, skin });
    }
    return welded.get(key);
  });
  for (let i = 0; i < indices.length; i += 3)
    faces.push({ ids: indices.slice(i, i + 3).map((j) => map[j]), material: primitive.material });
}

// 넓은 판 모양의 꼬리를 제거하고 원본 가중치를 따라가는 가는 털 다발로 교체한다.
const tailSource = vertices.filter((v) => v.position[1] > 0.012 && v.position[2] > 0.012);
faces = faces.filter(
  (f) =>
    f.material !== 1 ||
    f.ids.reduce((sum, i) => sum + vertices[i].position[1], 0) / 3 < 0.012 ||
    f.ids.reduce((sum, i) => sum + vertices[i].position[2], 0) / 3 > 0.028,
);
const compact = new Map();
const used = [];
for (const face of faces)
  face.ids = face.ids.map((i) => {
    if (!compact.has(i)) {
      compact.set(i, used.length);
      used.push(vertices[i]);
    }
    return compact.get(i);
  });
vertices = used;

for (let iteration = 0; iteration < 2; iteration += 1) {
  const edges = new Map();
  const neighbors = vertices.map(() => new Set());
  const keyFor = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (const {
    ids: [a, b, c],
  } of faces) {
    for (const [u, v, opposite] of [
      [a, b, c],
      [b, c, a],
      [c, a, b],
    ]) {
      const key = keyFor(u, v);
      if (!edges.has(key)) edges.set(key, { a: u, b: v, opposite: [] });
      edges.get(key).opposite.push(opposite);
      neighbors[u].add(v);
      neighbors[v].add(u);
    }
  }
  const boundaries = vertices.map(() => []);
  for (const e of edges.values())
    if (e.opposite.length === 1) {
      boundaries[e.a].push(e.b);
      boundaries[e.b].push(e.a);
    }
  const next = vertices.map((v, i) => {
    const border = boundaries[i];
    if (border.length === 2)
      return interpolate(vertices, [
        [i, 0.75],
        [border[0], 0.125],
        [border[1], 0.125],
      ]);
    if (border.length > 0 || neighbors[i].size < 3) return v;
    const n = neighbors[i].size;
    const beta = n === 3 ? 3 / 16 : 3 / (8 * n);
    return interpolate(vertices, [[i, 1 - n * beta], ...[...neighbors[i]].map((j) => [j, beta])]);
  });
  for (const edge of edges.values()) {
    edge.index = next.length;
    const { a, b, opposite } = edge;
    const stencil =
      opposite.length === 2
        ? [
            [a, 3 / 8],
            [b, 3 / 8],
            [opposite[0], 1 / 8],
            [opposite[1], 1 / 8],
          ]
        : [
            [a, 0.5],
            [b, 0.5],
          ];
    next.push(interpolate(vertices, stencil));
  }
  faces = faces.flatMap(({ ids: [a, b, c], material }) => {
    const ab = edges.get(keyFor(a, b)).index,
      bc = edges.get(keyFor(b, c)).index,
      ca = edges.get(keyFor(c, a)).index;
    return [
      [a, ab, ca],
      [b, bc, ab],
      [c, ca, bc],
      [ab, bc, ca],
    ].map((ids) => ({ ids, material }));
  });
  vertices = next;
}

for (let strand = 0; strand < 18; strand += 1) {
  const phase = strand * 2.39996;
  const spread = Math.sqrt((strand + 1) / 18);
  const offset = vertices.length;
  const rings = 12,
    sides = 6;
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    const y = 0.0145 + 0.012 * t - 0.003 * t * t;
    const z = 0.031 - 0.003 * t - (0.017 + 0.003 * Math.sin(phase)) * t * t;
    const x = Math.cos(phase) * spread * (0.00045 + 0.0011 * t) + Math.sin(t * 4 + phase) * 0.0004 * t;
    const radius = 0.00038 * Math.pow(1 - t, 0.65) + 0.000015;
    const dy = 0.012 - 0.006 * t,
      dz = -0.003 - (0.034 + 0.006 * Math.sin(phase)) * t;
    const tangentLength = Math.hypot(dy, dz);
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2;
      const position = [
        x + Math.cos(angle) * radius,
        y - (dz / tangentLength) * Math.sin(angle) * radius,
        z + (dy / tangentLength) * Math.sin(angle) * radius,
      ];
      const nearby = tailSource
        .map((v, i) => [i, 1 / (1e-10 + v.position.reduce((sum, n, axis) => sum + (n - position[axis]) ** 2, 0))])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const sum = nearby.reduce((n, [, weight]) => n + weight, 0);
      vertices.push({
        position,
        skin: blendWeights(
          tailSource,
          nearby.map(([i, weight]) => [i, weight / sum]),
        ),
      });
    }
  }
  for (let ring = 0; ring < rings; ring += 1)
    for (let side = 0; side < sides; side += 1) {
      const a = offset + ring * sides + side,
        b = offset + ring * sides + ((side + 1) % sides);
      faces.push({ ids: [a, a + sides, b], material: 1 }, { ids: [b, a + sides, b + sides], material: 1 });
    }
}

const normals = vertices.map(() => [0, 0, 0]);
for (const {
  ids: [a, b, c],
} of faces) {
  const p = vertices[a].position,
    q = vertices[b].position,
    r = vertices[c].position;
  const u = q.map((v, i) => v - p[i]),
    v = r.map((n, i) => n - p[i]);
  const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  for (const index of [a, b, c])
    normal.forEach((n, axis) => {
      normals[index][axis] += n;
    });
}
for (const normal of normals) {
  const length = Math.hypot(...normal) || 1;
  normal.forEach((n, i) => {
    normal[i] = n / length;
  });
}

const buffers = [binary];
let byteLength = binary.length;
function append(values, type, componentType = 5126) {
  const padding = (4 - (byteLength % 4)) % 4;
  if (padding) {
    buffers.push(Buffer.alloc(padding));
    byteLength += padding;
  }
  const bytes = componentType === 5123 ? 2 : 4;
  const data = Buffer.alloc(values.length * bytes);
  values.forEach((value, i) => {
    if (componentType === 5123) data.writeUInt16LE(value, i * bytes);
    else if (componentType === 5125) data.writeUInt32LE(value, i * bytes);
    else data.writeFloatLE(value, i * bytes);
  });
  const bufferView = gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: data.length }) - 1;
  byteLength += data.length;
  buffers.push(data);
  const accessor = { bufferView, componentType, count: values.length / SIZE[type], type };
  if (type === 'VEC3') {
    accessor.min = [0, 1, 2].map((axis) =>
      values.reduce((n, value, i) => (i % 3 === axis ? Math.min(n, value) : n), Infinity),
    );
    accessor.max = [0, 1, 2].map((axis) =>
      values.reduce((n, value, i) => (i % 3 === axis ? Math.max(n, value) : n), -Infinity),
    );
  }
  return gltf.accessors.push(accessor) - 1;
}
const attributes = {
  POSITION: append(
    vertices.flatMap((v) => v.position),
    'VEC3',
  ),
  NORMAL: append(normals.flat(), 'VEC3'),
  JOINTS_0: append(
    vertices.flatMap((v) => Array.from({ length: 4 }, (_, i) => v.skin[i]?.[0] ?? 0)),
    'VEC4',
    5123,
  ),
  WEIGHTS_0: append(
    vertices.flatMap((v) => Array.from({ length: 4 }, (_, i) => v.skin[i]?.[1] ?? 0)),
    'VEC4',
  ),
};
gltf.meshes[0].primitives = gltf.meshes[0].primitives.map((p) => ({
  attributes,
  material: p.material,
  indices: append(
    faces.filter((f) => f.material === p.material).flatMap((f) => f.ids),
    'SCALAR',
    5125,
  ),
}));
gltf.buffers[0].byteLength = byteLength;
gltf.asset.generator = 'Prairie: CC0 Quaternius horse, welded Loop subdivision × 2';
const json = Buffer.from(JSON.stringify(gltf));
const jsonPadded = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
const binPadded = Buffer.concat([...buffers, Buffer.alloc((4 - (byteLength % 4)) % 4)]);
const header = Buffer.alloc(20),
  binHeader = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + jsonPadded.length + binPadded.length, 8);
header.writeUInt32LE(jsonPadded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
binHeader.writeUInt32LE(binPadded.length);
binHeader.writeUInt32LE(0x004e4942, 4);
const destination = new URL('../public/models/unicorn.glb', import.meta.url);
writeFileSync(destination, Buffer.concat([header, jsonPadded, binHeader, binPadded]));
console.log(`${vertices.length} vertices, ${faces.length} triangles → ${fileURLToPath(destination)}`);
