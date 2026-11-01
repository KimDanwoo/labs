import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { catchCelebration, catchHeart } from '../src/features/walk/lib/catchCelebration';
import { FISHING_PHASE, type FishingFrame } from '../src/features/walk/lib/fishing';
import { createPierFishing } from '../src/features/walk/lib/pierFishing';

test('a catch rises from the final reel position, hops twice and settles without looping', () => {
  const start = catchCelebration(0);
  assert.equal(start.fishX, 11);
  assert.equal(start.fishY, -2.2);
  assert.equal(start.childLift, 0);
  assert.ok(catchCelebration(0.49).childLift > 2);
  assert.ok(catchCelebration(1.17).childLift > 1);
  assert.equal(catchCelebration(1.5).childLift, 0);
  assert.deepEqual(catchCelebration(3), catchCelebration(300));
  assert.ok(Math.abs(catchCelebration(3).fishY - 12.5) < 1e-8);
  for (const time of [-1, 0, 0.25, 1, 2, 60]) {
    assert.ok(Object.values(catchCelebration(time)).every(Number.isFinite));
  }
});

test('hearts appear once, float above the child and disappear; reduced motion never jumps', () => {
  for (let index = 0; index < 7; index++) {
    assert.equal(catchHeart(0, index).isVisible, false);
    assert.equal(catchHeart(3, index).isVisible, false);
  }
  assert.ok(catchHeart(1, 0).y > catchHeart(0.5, 0).y);
  for (const age of [0, 0.4, 1, 3]) {
    assert.equal(catchCelebration(age, true).childLift, 0);
    assert.equal(catchCelebration(age, true).fishY, 12.5);
    assert.equal(catchCelebration(age, true).splash, 0);
  }
});

test('the scene shows fish and hearts only on success and clears them on recast or close', () => {
  const scene = new THREE.Scene();
  const effect = createPierFishing(scene);
  const origin = new THREE.Vector3();
  const frame: FishingFrame = {
    phase: FISHING_PHASE.caught,
    elapsed: 0,
    tension: 0,
    progress: 100,
    isReeling: false,
    caught: { id: 'grouper', size: 100 },
  };
  effect.update(1, frame, origin, 1, false);
  const fish = scene.getObjectByName('caught-fish')!;
  const heart = scene.getObjectByName('catch-heart-0')!;
  assert.equal(fish.visible, true);
  assert.equal(heart.visible, true);
  assert.ok(fish.position.y > 5);
  effect.update(0, { ...frame, phase: FISHING_PHASE.casting }, origin, 1, false);
  assert.equal(fish.visible, false);
  assert.equal(heart.visible, false);
  effect.update(1, { ...frame, phase: FISHING_PHASE.missed }, origin, 1, false);
  assert.equal(fish.visible, false);
  assert.equal(heart.visible, false);
  effect.update(0, frame, origin, 1, false);
  assert.equal(heart.visible, false);
  effect.update(0, null, origin, 1, false);
  assert.equal(scene.getObjectByName('pier-fishing')!.visible, false);
  effect.dispose();
  assert.equal(scene.children.length, 0);
});
