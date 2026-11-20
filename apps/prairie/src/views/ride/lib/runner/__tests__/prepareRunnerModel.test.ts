import { applyRunnerDetail, prepareRunnerModel } from '@views/ride/lib/runner/prepareRunnerModel';
import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';

const PART_NAMES = ['Main', 'Hooves', 'Eye_Black'];

function unicornScene(): Group {
  const scene = new Group();
  for (const name of PART_NAMES) scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name })));
  scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ name: 'Hair' })));
  return scene;
}

test('고사양은 광택 재질과 그림자, 저사양은 같은 색·거칠기의 단순 재질과 그림자 끔', () => {
  const prepared = prepareRunnerModel(unicornScene());
  assert.equal(prepared.meshes.length, PART_NAMES.length);

  for (const { mesh, detailed, simple } of prepared.meshes) {
    assert.ok(detailed instanceof MeshPhysicalMaterial);
    assert.ok(simple instanceof MeshStandardMaterial && !(simple instanceof MeshPhysicalMaterial));
    assert.equal(simple.name, detailed.name);
    assert.equal(simple.color.getHex(), detailed.color.getHex());
    assert.equal(simple.roughness, detailed.roughness);
    assert.equal(simple.metalness, detailed.metalness);
    assert.equal(simple.envMapIntensity, detailed.envMapIntensity);
    assert.equal(mesh.material, detailed, '처음에는 고사양 재질');
  }

  applyRunnerDetail(prepared, true);
  for (const { mesh, simple } of prepared.meshes) {
    assert.equal(mesh.material, simple);
    assert.equal(mesh.castShadow, false);
  }

  applyRunnerDetail(prepared, false);
  for (const { mesh, detailed } of prepared.meshes) {
    assert.equal(mesh.material, detailed);
    assert.equal(mesh.castShadow, true);
  }
});

test('두 재질 묶음을 모두 정리 대상으로 한 번씩 담고, 털 메시는 숨긴다', () => {
  const prepared = prepareRunnerModel(unicornScene());
  assert.equal(prepared.materials.length, PART_NAMES.length * 2);
  assert.equal(new Set(prepared.materials).size, prepared.materials.length);
  const hair = prepared.model.children.find(
    (child) => child instanceof Mesh && !Array.isArray(child.material) && child.material.name === 'Hair',
  );
  assert.equal(hair?.visible, false);
});
