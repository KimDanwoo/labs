import { readFileSync, writeFileSync } from 'node:fs';

const READ = { 5123: ['readUInt16LE', 2], 5125: ['readUInt32LE', 4], 5126: ['readFloatLE', 4] };
const SIZE = { SCALAR: 1, VEC3: 3, VEC4: 4 };

export function readGlb(url) {
  const source = readFileSync(url);
  const jsonLength = source.readUInt32LE(12);
  const gltf = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
  const binaryStart = 28 + jsonLength;
  const binary = source.subarray(binaryStart);
  return { gltf, binary };
}

export function readAccessor(gltf, binary, index) {
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

export function writeGlb(destination, gltf, binary, { vertices, faces, normals }, generator) {
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
  gltf.asset.generator = generator;
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
  writeFileSync(destination, Buffer.concat([header, jsonPadded, binHeader, binPadded]));
}
