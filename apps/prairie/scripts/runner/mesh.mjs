import { readAccessor } from './glb.mjs';
import { interpolate } from './skin.mjs';

const BODY_MATERIAL = 0;
const HAIR_MATERIAL = 1;

export function weldMesh(gltf, binary) {
  const vertices = [];
  const faces = [];
  const welded = new Map();
  for (const primitive of gltf.meshes[0].primitives) {
    const positions = readAccessor(gltf, binary, primitive.attributes.POSITION);
    const joints = readAccessor(gltf, binary, primitive.attributes.JOINTS_0);
    const weights = readAccessor(gltf, binary, primitive.attributes.WEIGHTS_0);
    const indices = readAccessor(gltf, binary, primitive.indices).flat();
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
  return { vertices, faces };
}

export function stripPlateTail({ vertices, faces: allFaces }) {
  const tailSource = vertices.filter((v) => v.position[1] > 0.012 && v.position[2] > 0.012);
  const faces = allFaces.filter(
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
  return { mesh: { vertices: used, faces }, tailSource };
}

function openBoundaryLoops(faces) {
  const halfEdges = new Set();
  for (const {
    ids: [a, b, c],
  } of faces)
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ])
      halfEdges.add(`${u}:${v}`);
  const previous = new Map();
  for (const key of halfEdges) {
    const [u, v] = key.split(':').map(Number);
    if (!halfEdges.has(`${v}:${u}`)) previous.set(v, u);
  }
  const visited = new Set();
  const loops = [];
  for (const start of previous.keys()) {
    const loop = [];
    for (let at = start; at !== undefined && !visited.has(at); at = previous.get(at)) {
      visited.add(at);
      loop.push(at);
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}

function reclaimHairAround(faces, loop) {
  const pending = new Set(loop);
  const reached = new Set();
  while (pending.size) {
    const [vertex] = pending;
    pending.delete(vertex);
    reached.add(vertex);
    for (const face of faces) {
      if (face.material !== HAIR_MATERIAL) continue;
      if (!face.ids.includes(vertex)) continue;
      face.material = BODY_MATERIAL;
      face.ids.filter((id) => !reached.has(id)).forEach((id) => pending.add(id));
    }
  }
}

export function closeBoundaryLoops({ vertices, faces }) {
  for (const loop of openBoundaryLoops(faces)) {
    reclaimHairAround(faces, loop);
    const center = vertices.length;
    vertices.push(
      interpolate(
        vertices,
        loop.map((i) => [i, 1 / loop.length]),
      ),
    );
    loop.forEach((at, k) => faces.push({ ids: [center, at, loop[(k + 1) % loop.length]], material: BODY_MATERIAL }));
  }
}

export function computeNormals({ vertices, faces }) {
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
  return normals;
}
