import assert from 'node:assert/strict';
import test from 'node:test';
import { gaitWeights } from '../src/entities/runner/model/services/gaitWeights.ts';

const weights = (speed, height) => gaitWeights(speed, height, 4, 7);

test('공중 이동 중에는 정지 포즈 대신 갤럽 클립을 재생한다', () => {
  assert.equal(weights(8, 5).run, 1);
  assert.equal(weights(-8, 5).run, 1);
  assert.equal(weights(8, 5).flight, 0);
});

test('공중 제자리에서는 다리를 접고 지상에서는 걷기와 달리기를 전환한다', () => {
  assert.equal(weights(0, 5).flight, 1);
  assert.ok(weights(2, 5).walk > 0.7);
  assert.equal(weights(2, 5).run, 0);
  assert.equal(weights(0, 0).idle, 1);
  assert.equal(weights(2, 0).walk, 1);
  assert.equal(weights(8, 0).run, 1);
});

test('이륙·착륙·저속 비행의 혼합 가중치는 항상 정규화된다', () => {
  for (const speed of [-10, -1, 0, 0.3, 0.6, 1, 2, 5, 12]) {
    for (const height of [0, 0.15, 0.3, 0.6, 0.8, 10]) {
      const { airborne, ...gaits } = weights(speed, height);
      assert.ok(airborne >= 0 && airborne <= 1);
      assert.ok(Object.values(gaits).every((value) => value >= 0 && value <= 1));
      assert.ok(Math.abs(Object.values(gaits).reduce((sum, value) => sum + value, 0) - 1) < 1e-10);
    }
  }
});

test('실제 GLB를 공중 이동 가중치로 재생하면 네 다리의 포즈가 모두 바뀐다', async () => {
  const { readFileSync } = await import('node:fs');
  const { AnimationMixer, PropertyBinding } = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const bytes = readFileSync(new URL('../public/models/unicorn.glb', import.meta.url));
  const gltf = await new Promise((resolve, reject) =>
    new GLTFLoader().parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      '',
      resolve,
      reject,
    ),
  );
  const names = ['FrontUpperLeg.L', 'FrontUpperLeg.R', 'BackUpperLeg.L', 'BackUpperLeg.R'];
  const legs = names.map((name) => gltf.scene.getObjectByName(PropertyBinding.sanitizeNodeName(name)));
  assert.ok(legs.every(Boolean));
  for (const [speed, clipName, gait] of [
    [2, 'Walk', 'walk'],
    [8, 'Gallop', 'run'],
  ]) {
    const mixer = new AnimationMixer(gltf.scene);
    const clip = gltf.animations.find((animation) => animation.name === `AnimalArmature|${clipName}`);
    assert.ok(clip);
    const action = mixer.clipAction(clip).play();
    action.weight = weights(speed, 5)[gait];
    const poses = names.map(() => []);
    for (let frame = 0; frame < 8; frame += 1) {
      mixer.update(0.09);
      legs.forEach((bone, index) => poses[index].push(bone.quaternion.toArray()));
    }
    poses.forEach((samples, index) => {
      assert.ok(
        samples.slice(1).some((pose) => pose.some((value, axis) => Math.abs(value - samples[0][axis]) > 0.01)),
        `${clipName}: ${names[index]}`,
      );
    });
    mixer.stopAllAction();
    mixer.uncacheRoot(gltf.scene);
  }
});
