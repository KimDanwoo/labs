import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import draco3d from 'draco3d';

const EXTENSION = 'KHR_draco_mesh_compression';
const QUANTIZATION_BITS = { POSITION: 14, NORMAL: 10, TEXCOORD_0: 14 };
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ARRAY_BY_COMPONENT = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const MAX_BOUNDS_DRIFT = 1e-3;
const TRIANGLES = 4;
const GLB = { magic: 0x46546c67, version: 2, json: 0x4e4f534a, bin: 0x004e4942 };

const align4 = (value) => (value + 3) & ~3;

const encoder = await draco3d.createEncoderModule({});
const decoder = await draco3d.createDecoderModule({});
const DRACO_ATTRIBUTE = { POSITION: encoder.POSITION, NORMAL: encoder.NORMAL, TEXCOORD_0: encoder.TEX_COORD };

function parseGlb(buffer) {
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  const binStart = 20 + jsonLength + 8;
  return { json, bin: buffer.subarray(binStart, binStart + buffer.readUInt32LE(20 + jsonLength)) };
}

function readAccessor(json, bin, index) {
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

function encodePrimitive(json, bin, primitive) {
  const indices = Uint32Array.from(readAccessor(json, bin, primitive.indices));
  const builder = new encoder.MeshBuilder();
  const mesh = new encoder.Mesh();
  builder.AddFacesToMesh(mesh, indices.length / 3, indices);
  const attributeIds = {};
  for (const [name, accessorIndex] of Object.entries(primitive.attributes)) {
    if (DRACO_ATTRIBUTE[name] === undefined) throw new Error(`${name} 속성은 압축할 수 없어요.`);
    const accessor = json.accessors[accessorIndex];
    const values = readAccessor(json, bin, accessorIndex);
    attributeIds[name] = builder.AddFloatAttributeToMesh(
      mesh,
      DRACO_ATTRIBUTE[name],
      accessor.count,
      COMPONENTS[accessor.type],
      values,
    );
  }
  const dracoEncoder = new encoder.Encoder();
  for (const [name, bits] of Object.entries(QUANTIZATION_BITS)) {
    dracoEncoder.SetAttributeQuantization(DRACO_ATTRIBUTE[name], bits);
  }
  dracoEncoder.SetEncodingMethod(encoder.MESH_EDGEBREAKER_ENCODING);
  const output = new encoder.DracoInt8Array();
  const byteLength = dracoEncoder.EncodeMeshToDracoBuffer(mesh, output);
  if (byteLength <= 0) throw new Error('Draco 압축에 실패했어요.');
  const bytes = Uint8Array.from({ length: byteLength }, (_, index) => output.GetValue(index));
  for (const object of [output, dracoEncoder, mesh, builder]) encoder.destroy(object);
  return { bytes, attributeIds, faceCount: indices.length / 3 };
}

function attributeBounds(dracoDecoder, mesh, attributeId, components) {
  const values = new decoder.DracoFloat32Array();
  dracoDecoder.GetAttributeFloatForAllPoints(mesh, dracoDecoder.GetAttributeByUniqueId(mesh, attributeId), values);
  const min = Array.from({ length: components }, () => Infinity);
  const max = Array.from({ length: components }, () => -Infinity);
  for (let index = 0; index < values.size(); index += 1) {
    const axis = index % components;
    min[axis] = Math.min(min[axis], values.GetValue(index));
    max[axis] = Math.max(max[axis], values.GetValue(index));
  }
  decoder.destroy(values);
  return { min, max };
}

function assertSameSize(decoded, expected) {
  const extent = Math.max(...expected.max.map((value, axis) => value - expected.min[axis]));
  const drift = Math.max(
    ...decoded.min.map((value, axis) => Math.abs(value - expected.min[axis])),
    ...decoded.max.map((value, axis) => Math.abs(value - expected.max[axis])),
  );
  if (drift > extent * MAX_BOUNDS_DRIFT) throw new Error('압축 후 모델 크기가 달라졌어요.');
}

function decodeAccessors(json, primitive, { bytes, attributeIds, faceCount }) {
  const buffer = new decoder.DecoderBuffer();
  buffer.Init(new Int8Array(bytes.buffer), bytes.byteLength);
  const dracoDecoder = new decoder.Decoder();
  const mesh = new decoder.Mesh();
  const status = dracoDecoder.DecodeBufferToMesh(buffer, mesh);
  if (!status.ok()) throw new Error(`압축 결과를 풀지 못했어요: ${status.error_msg()}`);
  if (mesh.num_faces() !== faceCount) throw new Error('압축 전후 면 수가 달라요.');

  const accessors = Object.entries(primitive.attributes).map(([name, index]) => {
    const accessor = json.accessors[index];
    const bounds = attributeBounds(dracoDecoder, mesh, attributeIds[name], COMPONENTS[accessor.type]);
    if (name === 'POSITION') assertSameSize(bounds, accessor);
    return { accessor, bounds };
  });
  const pointCount = mesh.num_points();
  for (const object of [mesh, dracoDecoder, buffer]) decoder.destroy(object);
  return { pointCount, accessors };
}

function assertSupported(json, primitive) {
  const accessors = [primitive.indices, ...Object.values(primitive.attributes)].map((index) => json.accessors[index]);
  if ((primitive.mode ?? TRIANGLES) !== TRIANGLES) throw new Error('삼각형 메시만 압축할 수 있어요.');
  if (primitive.indices === undefined) throw new Error('인덱스가 없는 메시는 압축할 수 없어요.');
  if (primitive.targets) throw new Error('모프 타깃이 있는 메시는 압축할 수 없어요.');
  if (accessors.some((accessor) => accessor.sparse)) throw new Error('sparse accessor는 압축할 수 없어요.');
}

function packBuffers(json, bin, encoded, replacedAccessors) {
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

function writeGlb(json, binary) {
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

function compress(file) {
  const source = readFileSync(file);
  const { json, bin } = parseGlb(source);
  if (json.extensionsUsed?.includes(EXTENSION)) return null;

  const encoded = [];
  const replacedAccessors = new Set();
  for (const primitive of json.meshes.flatMap(({ primitives }) => primitives)) {
    assertSupported(json, primitive);
    const result = encodePrimitive(json, bin, primitive);
    const { pointCount, accessors } = decodeAccessors(json, primitive, result);
    for (const { accessor, bounds } of accessors) {
      accessor.count = pointCount;
      if (accessor.min) accessor.min = bounds.min;
      if (accessor.max) accessor.max = bounds.max;
    }
    for (const index of [primitive.indices, ...Object.values(primitive.attributes)]) replacedAccessors.add(index);
    primitive.extensions = { ...primitive.extensions, [EXTENSION]: { bufferView: -1, attributes: result.attributeIds } };
    encoded.push({ primitive, bytes: result.bytes });
  }

  const binary = packBuffers(json, bin, encoded, replacedAccessors);
  json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []), EXTENSION])];
  json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []), EXTENSION])];
  const output = writeGlb(json, binary);
  writeFileSync(file, output);
  return { before: source.length, after: output.length };
}

const toKilobytes = (bytes) => `${Math.round(bytes / 1024)}KB`;

for (const file of process.argv.slice(2)) {
  const result = compress(file);
  const name = path.basename(file);
  console.log(result ? `${name}: ${toKilobytes(result.before)} → ${toKilobytes(result.after)}` : `${name}: 이미 압축됨`);
}
