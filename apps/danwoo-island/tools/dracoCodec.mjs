import draco3d from 'draco3d';
import { COMPONENTS, readAccessor } from './gltfBinary.mjs';

const QUANTIZATION_BITS = { POSITION: 14, NORMAL: 10, TEXCOORD_0: 14 };

const MAX_BOUNDS_DRIFT = 1e-3;

const TRIANGLES = 4;

const encoder = await draco3d.createEncoderModule({});

const decoder = await draco3d.createDecoderModule({});

const DRACO_ATTRIBUTE = { POSITION: encoder.POSITION, NORMAL: encoder.NORMAL, TEXCOORD_0: encoder.TEX_COORD };

export function encodePrimitive(json, bin, primitive) {
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

export function decodeAccessors(json, primitive, { bytes, attributeIds, faceCount }) {
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

export function assertSupported(json, primitive) {
  const accessors = [primitive.indices, ...Object.values(primitive.attributes)].map((index) => json.accessors[index]);
  if ((primitive.mode ?? TRIANGLES) !== TRIANGLES) throw new Error('삼각형 메시만 압축할 수 있어요.');
  if (primitive.indices === undefined) throw new Error('인덱스가 없는 메시는 압축할 수 없어요.');
  if (primitive.targets) throw new Error('모프 타깃이 있는 메시는 압축할 수 없어요.');
  if (accessors.some((accessor) => accessor.sparse)) throw new Error('sparse accessor는 압축할 수 없어요.');
}
