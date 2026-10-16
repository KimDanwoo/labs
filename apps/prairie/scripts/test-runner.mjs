import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function load(name) {
  const bytes = readFileSync(new URL(`../public/models/${name}.glb`, import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  return { gltf, bin: bytes.subarray(jsonLength + 28) };
}
const original = load('runner');
const refined = load('unicorn');

function read(index) {
  const a = refined.gltf.accessors[index];
  const view = refined.gltf.bufferViews[a.bufferView];
  const width = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  const size = a.componentType === 5123 ? 2 : 4;
  const method = a.componentType === 5123 ? 'readUInt16LE' : a.componentType === 5125 ? 'readUInt32LE' : 'readFloatLE';
  return Array.from({ length: a.count }, (_, i) =>
    Array.from({ length: width }, (_, c) =>
      refined.bin[method]((view.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * width * size + c * size),
    ),
  );
}

test('곡면 모델은 원본 뼈대와 모든 애니메이션을 보존한다', () => {
  assert.deepEqual(refined.gltf.nodes, original.gltf.nodes);
  assert.deepEqual(refined.gltf.skins, original.gltf.skins);
  assert.deepEqual(refined.gltf.animations, original.gltf.animations);
  assert.ok(refined.gltf.animations.some((a) => a.name === 'AnimalArmature|Walk'));
  assert.ok(refined.gltf.animations.some((a) => a.name === 'AnimalArmature|Gallop_Jump'));
});

test('세분화한 모든 정점의 스키닝 가중치와 법선이 유효하다', () => {
  const attributes = refined.gltf.meshes[0].primitives[0].attributes;
  const positions = read(attributes.POSITION);
  const weights = read(attributes.WEIGHTS_0);
  const joints = read(attributes.JOINTS_0);
  const normals = read(attributes.NORMAL);
  assert.ok(positions.length > 10000 && positions.length < 25000);
  positions.forEach((p, i) => {
    assert.ok(p.every(Number.isFinite));
    assert.ok(weights[i].every((w) => w >= 0 && w <= 1));
    assert.ok(Math.abs(weights[i].reduce((sum, w) => sum + w, 0) - 1) < 1e-5);
    assert.ok(joints[i].every((j) => j < refined.gltf.skins[0].joints.length));
    assert.ok(Math.abs(Math.hypot(...normals[i]) - 1) < 0.01, `normal ${i}`);
  });
});

test('재질 그룹·인덱스를 유지하고 삼각형 예산을 지킨다', () => {
  const primitives = refined.gltf.meshes[0].primitives;
  assert.deepEqual(
    primitives.map((p) => p.material),
    original.gltf.meshes[0].primitives.map((p) => p.material),
  );
  let triangles = 0;
  for (const primitive of primitives) {
    const count = refined.gltf.accessors[primitive.attributes.POSITION].count;
    const indices = read(primitive.indices).flat();
    assert.equal(indices.length % 3, 0);
    assert.ok(indices.every((i) => i >= 0 && i < count));
    triangles += indices.length / 3;
  }
  assert.ok(triangles < 40000);
});
