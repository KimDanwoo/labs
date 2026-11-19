import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { assertSupported, decodeAccessors, encodePrimitive } from './dracoCodec.mjs';
import { EXTENSION, packBuffers, parseGlb, writeGlb } from './gltfBinary.mjs';

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
    primitive.extensions = {
      ...primitive.extensions,
      [EXTENSION]: { bufferView: -1, attributes: result.attributeIds },
    };
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
  console.log(
    result ? `${name}: ${toKilobytes(result.before)} → ${toKilobytes(result.after)}` : `${name}: 이미 압축됨`,
  );
}
