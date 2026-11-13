import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { SCHOOL_REGION, SCHOOLMATES } from '../../model/schoolmates';
import { createSchoolmates } from '../schoolmatesScene';

const paint = { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} };
Object.assign(globalThis, { document: { createElement: () => ({ getContext: () => paint }) } });
const FRAME = {
  region: SCHOOL_REGION.yard,
  dt: 1 / 30,
  darkness: 0,
  isStill: false,
  isRaining: false,
  player: { x: 50, z: 39 },
};

class DeferredLoader extends THREE.TextureLoader {
  readonly requests: { url: string; resolve: (texture: THREE.Texture<HTMLImageElement>) => void }[] = [];

  override loadAsync(url: string): Promise<THREE.Texture<HTMLImageElement>> {
    return new Promise((resolve) => this.requests.push({ url, resolve }));
  }
}

test('friends load only at school, reuse their artwork and release their scene resources', async () => {
  const loader = new DeferredLoader();
  const scene = new THREE.Scene();
  const notices: string[] = [];
  const friends = createSchoolmates(scene, loader, (notice) => notices.push(notice));
  friends.update({ ...FRAME, region: 'village' });
  assert.equal(loader.requests.length, 0);
  friends.update(FRAME);
  assert.equal(loader.requests.length, SCHOOLMATES.length * 2);
  let disposed = 0;
  loader.requests.forEach(({ resolve }) => {
    const texture = new THREE.Texture<HTMLImageElement>();
    texture.addEventListener('dispose', () => disposed++);
    resolve(texture);
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  friends.update(FRAME);
  assert.equal(friends.standing.length, SCHOOLMATES.length);
  assert.equal(scene.children.length, SCHOOLMATES.length * 2);
  friends.update({ ...FRAME, region: SCHOOL_REGION.classroom });
  assert.equal(friends.standing.length, SCHOOLMATES.length);
  assert.equal(loader.requests.length, SCHOOLMATES.length * 2);
  friends.update({ ...FRAME, region: 'home' });
  assert.equal(friends.standing.length, 0);
  assert.ok(scene.children.every((child) => !child.visible));
  friends.dispose();
  assert.equal(disposed, SCHOOLMATES.length * 2);
  assert.equal(scene.children.length, 0);
  assert.deepEqual(notices, []);
});

test('artwork arriving after the walk is closed is disposed instead of creating orphan friends', async () => {
  const loader = new DeferredLoader();
  const scene = new THREE.Scene();
  const friends = createSchoolmates(scene, loader, () => {});
  friends.update(FRAME);
  friends.dispose();
  let disposed = 0;
  loader.requests.forEach(({ resolve }) => {
    const texture = new THREE.Texture<HTMLImageElement>();
    texture.addEventListener('dispose', () => disposed++);
    resolve(texture);
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(disposed, SCHOOLMATES.length * 2);
  assert.equal(scene.children.length, 0);
  assert.equal(friends.standing.length, 0);
});

test('friends shelter from rain outside and leave school at night', async () => {
  const loader = new DeferredLoader();
  const friends = createSchoolmates(new THREE.Scene(), loader, () => {});
  friends.update(FRAME);
  loader.requests.forEach(({ resolve }) => resolve(new THREE.Texture<HTMLImageElement>()));
  await new Promise<void>((resolve) => setImmediate(resolve));
  friends.update({ ...FRAME, isRaining: true });
  assert.equal(friends.standing.length, 0);
  friends.update({ ...FRAME, isRaining: true, region: SCHOOL_REGION.hallway });
  assert.equal(friends.standing.length, SCHOOLMATES.length);
  friends.update({ ...FRAME, darkness: 1, region: SCHOOL_REGION.classroom });
  assert.equal(friends.standing.length, 0);
  friends.dispose();
});

test('greeting holds the selected friend in place, then walking resumes on close', async () => {
  const loader = new DeferredLoader();
  const friends = createSchoolmates(new THREE.Scene(), loader, () => {});
  friends.update(FRAME);
  loader.requests.forEach(({ resolve }) => resolve(new THREE.Texture<HTMLImageElement>()));
  await new Promise<void>((resolve) => setImmediate(resolve));
  friends.update(FRAME);
  const friend = friends.standing[0];
  assert.ok(friend);
  assert.equal(friends.greet(friend.id, FRAME.player), null);
  const player = { x: friend.x, z: friend.z + 3 };
  assert.ok(friends.greet(friend.id, player));
  for (let index = 0; index < 200; index++) friends.update({ ...FRAME, player });
  assert.equal(friends.standing[0]?.x, friend.x);
  assert.equal(friends.standing[0]?.z, friend.z);
  friends.endGreeting();
  for (let index = 0; index < 200; index++) friends.update({ ...FRAME, player: FRAME.player });
  assert.notEqual(friends.standing[0]?.x, friend.x);
  friends.update({ ...FRAME, isRaining: true });
  assert.equal(friends.greet(friend.id, player), null);
  friends.dispose();
});
