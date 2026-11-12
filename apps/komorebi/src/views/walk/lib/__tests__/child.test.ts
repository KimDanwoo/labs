import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { CHARACTER, CHARACTER_RIG, OUTFIT, characterLayers } from '../../model/world/appearance';
import { createChild } from '../child';

test('body and clothes keep the same directional pose, transform and lighting', () => {
  const body = new THREE.Texture();
  const outfit = new THREE.Texture();
  const child = createChild({ body, outfit });
  for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    for (let step = 0; step < 8; step++) {
      child.update({ dt: 1 / 30, travel: 1, heading, isWalking: true, isRunning: false, isStill: false });
      assert.deepEqual(body.offset.toArray(), outfit.offset.toArray());
      assert.deepEqual(body.repeat.toArray(), outfit.repeat.toArray());
    }
  }
  child.setLight(0.8, 0.3);
  const sprites = child.group.children.filter((part): part is THREE.Sprite => part instanceof THREE.Sprite);
  assert.equal(sprites.length, 2);
  const [clothingSprite, bodySprite] = sprites;
  assert.ok(bodySprite && clothingSprite);
  assert.equal(bodySprite.material.map, body);
  assert.equal(clothingSprite.material.map, outfit);
  assert.deepEqual(bodySprite.scale.toArray(), clothingSprite.scale.toArray());
  assert.deepEqual(bodySprite.position.toArray(), clothingSprite.position.toArray());
  assert.deepEqual(bodySprite.material.color.toArray(), clothingSprite.material.color.toArray());
  child.dispose();
});

test('changing outfits retains the body, position and current walk frame', () => {
  const body = new THREE.Texture();
  const summer = new THREE.Texture();
  const overalls = new THREE.Texture();
  const child = createChild({ body, outfit: summer });
  child.group.position.set(12, 23, 2);
  child.update({ dt: 0.05, travel: 3, heading: Math.PI / 2, isWalking: true, isRunning: false, isStill: false });
  const pose = body.offset.toArray();
  child.setOutfit(overalls);
  assert.deepEqual(body.offset.toArray(), pose);
  assert.deepEqual(overalls.offset.toArray(), pose);
  assert.deepEqual(child.group.position.toArray(), [12, 23, 2]);
  const sprites = child.group.children.filter((part): part is THREE.Sprite => part instanceof THREE.Sprite);
  assert.equal(sprites[1]?.material.map, body);
  assert.equal(sprites[0]?.material.map, overalls);
  child.dispose();
});

test('back-facing boy poses align to the shared outfit through their own body pivots', () => {
  const body = new THREE.Texture();
  const outfit = new THREE.Texture();
  const { bodyPoseOffsets } = characterLayers({ character: CHARACTER.boy, outfit: OUTFIT.summer });
  const child = createChild({ body, outfit, bodyPoseOffsets });
  child.update({ dt: 0, travel: 0, heading: Math.PI, isWalking: false, isRunning: false, isStill: true });
  const sprites = child.group.children.filter((part): part is THREE.Sprite => part instanceof THREE.Sprite);
  const [costume, parts] = sprites;
  assert.ok(costume && parts);
  const frameHeight = CHARACTER_RIG.height / CHARACTER_RIG.rows;
  assert.equal(costume.center.y, CHARACTER_RIG.footInset / frameHeight);
  assert.equal(parts.center.y, (CHARACTER_RIG.footInset + (bodyPoseOffsets[16] ?? 0)) / frameHeight);
  child.setOutfit(new THREE.Texture());
  assert.equal(parts.center.y, (CHARACTER_RIG.footInset + (bodyPoseOffsets[16] ?? 0)) / frameHeight);
  child.dispose();
});
