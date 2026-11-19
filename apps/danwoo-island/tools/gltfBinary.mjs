export const EXTENSION = 'KHR_draco_mesh_compression';

export const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

const ARRAY_BY_COMPONENT = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

const GLB = { magic: 0x46546c67, version: 2, json: 0x4e4f534a, bin: 0x004e4942 };

const align4 = (value) => (value + 3) & ~3;

export function parseGlb(buffer) {
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  const binStart = 20 + jsonLength + 8;
  return { json, bin: buffer.subarray(binStart, binStart + buffer.readUInt32LE(20 + jsonLength)) };
}

export function readAccessor(json, bin, index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const ArrayType = ARRAY_BY_COMPONENT[accessor.componentType];
  const components = COMPONENTS[accessor.type];
  if (view.byteStride && view.byteStride !== ArrayType.BYTES_PER_ELEMENT * components) {
    throw new Error('인터리브된 정점 버퍼는 지원하지 않아요.');
  }
  const start = bin.byteOffset + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return new ArrayType(bin.buffer.slice(start, start + accessor.count * components * ArrayType.BYTES_PER_ELEMENT));
}

export function packBuffers(json, bin, encoded, replacedAccessors) {
  const keptViews = new Set(
    json.accessors.filter((_, index) => !replacedAccessors.has(index)).map(({ bufferView }) => bufferView),
  );
  for (const image of json.images ?? []) keptViews.add(image.bufferView);

  const chunks = [];
  const views = [];
  const viewIndex = new Map();
  let offset = 0;
  const append = (bytes, view) => {
    chunks.push({ offset, bytes });
    views.push({ ...view, buffer: 0, byteOffset: offset, byteLength: bytes.byteLength });
    offset = align4(offset + bytes.byteLength);
    return views.length - 1;
  };

  json.bufferViews.forEach((view, index) => {
    if (!keptViews.has(index)) return;
    const { byteOffset = 0, byteLength, ...rest } = view;
    viewIndex.set(index, append(bin.subarray(byteOffset, byteOffset + byteLength), rest));
  });
  for (const { primitive, bytes } of encoded) primitive.extensions[EXTENSION].bufferView = append(bytes, {});

  json.accessors.forEach((accessor, index) => {
    if (!replacedAccessors.has(index)) {
      accessor.bufferView = viewIndex.get(accessor.bufferView);
      return;
    }
    delete accessor.bufferView;
    delete accessor.byteOffset;
  });
  for (const image of json.images ?? []) image.bufferView = viewIndex.get(image.bufferView);
  json.bufferViews = views;
  json.buffers = [{ byteLength: offset }];

  const binary = Buffer.alloc(offset);
  for (const chunk of chunks) Buffer.from(chunk.bytes).copy(binary, chunk.offset);
  return binary;
}

export function writeGlb(json, binary) {
  const text = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonChunk = Buffer.concat([text, Buffer.alloc(align4(text.length) - text.length, 0x20)]);
  const chunkHeader = (length, type) => {
    const header = Buffer.alloc(8);
    header.writeUInt32LE(length, 0);
    header.writeUInt32LE(type, 4);
    return header;
  };
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB.magic, 0);
  header.writeUInt32LE(GLB.version, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binary.length, 8);
  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, GLB.json),
    jsonChunk,
    chunkHeader(binary.length, GLB.bin),
    binary,
  ]);
}
