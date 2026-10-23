import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createRegionPlates, nearbyRegions } from '../src/features/walk/lib/regionPlates';
import { WORLDS, type Region } from '../src/shared/world/world';

test('nearby regions are the current painting and the ones its exits lead to', () => {
  assert.deepEqual(nearbyRegions('village').sort(), ['forest', 'river', 'shops', 'village']);
  assert.equal(nearbyRegions('river')[0], 'river');
  assert.ok(!nearbyRegions('forest').includes('coast'));
});

/** A loader whose requests finish only when the test says so, in any order. */
function deferredLoader() {
  const pending = new Map<string, { resolve: (t: THREE.Texture) => void; reject: (e: Error) => void }>();
  const disposed: string[] = [];
  const requested: string[] = [];
  return {
    loader: {
      loadAsync: (url: string) =>
        new Promise<THREE.Texture>((resolve, reject) => {
          requested.push(url);
          pending.set(url, { resolve, reject });
        }),
    },
    requested,
    disposed,
    finish(region: Region) {
      const url = WORLDS[region].image;
      const texture = new THREE.Texture();
      texture.addEventListener('dispose', () => disposed.push(region));
      pending.get(url)!.resolve(texture);
      pending.delete(url);
    },
    fail(region: Region) {
      pending.get(WORLDS[region].image)!.reject(new Error('offline'));
    },
  };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('a painting that arrives after the walker moved on is freed, not kept', async () => {
  const fake = deferredLoader();
  const plates = createRegionPlates(fake.loader, ['village']);
  const late = plates.ensure('village');
  plates.focus(['river']);
  fake.finish('village');
  await assert.rejects(late, { name: 'AbortError' });
  assert.equal(plates.get('village'), undefined);
  assert.deepEqual(fake.disposed, ['village']);
});

test('changing focus frees paintings outside it and abandons the older preload queue', async () => {
  const fake = deferredLoader();
  const plates = createRegionPlates(fake.loader, ['village']);
  plates.focus(['village', 'forest', 'shops']);
  await tick();
  fake.finish('village');
  await tick();
  plates.focus(['river']);
  fake.finish('forest');
  await tick();
  assert.equal(plates.get('village'), undefined);
  assert.equal(plates.get('forest'), undefined);
  assert.ok(!fake.requested.includes(WORLDS.shops.image), 'the old queue stopped before shops');
  assert.ok(fake.requested.includes(WORLDS.river.image));
});

test('a failed painting can be requested again, and nothing loads after dispose', async () => {
  const fake = deferredLoader();
  const plates = createRegionPlates(fake.loader, ['river']);
  const first = plates.ensure('river');
  fake.fail('river');
  await assert.rejects(first, /offline/);
  const second = plates.ensure('river');
  fake.finish('river');
  assert.ok(await second);
  plates.dispose();
  assert.deepEqual(fake.disposed, ['river']);
  await assert.rejects(plates.ensure('river'), { name: 'AbortError' });
});
