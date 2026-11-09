import { catPosition, createCompanionScene } from '@features/walk/lib/companionScene';
import {
  type Companions,
  BAG_CAPACITY,
  COMPANION_ACTION,
  COMPANION_REACTION,
  EMPTY_COMPANIONS,
  FISH_HOME,
  TANK_CAPACITY,
  catBond,
  changeCompanions,
  parseCompanions,
} from '@features/walk/lib/companions';
import { type FishingFrame, FISHING_PHASE } from '@features/walk/lib/fishing';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { FISHING_PIER, HOME, HOME_AQUARIUM, PIER_CAT, canWalk, findRoute } from '../src/shared/world/world';

const caught = { id: 'goby', size: 15 };
const keep = (state: Companions, uid: string) =>
  changeCompanions(state, { kind: COMPANION_ACTION.keep, fish: caught, uid });

test('one catch moves between bag and tank without duplication and sharing consumes it once', () => {
  const first = keep(EMPTY_COMPANIONS, 'one');
  assert.equal(keep(first, 'one'), first);
  const tank = changeCompanions(first, { kind: COMPANION_ACTION.tank, uid: 'one' });
  assert.equal(tank.fish.length, 1);
  assert.equal(tank.fish[0]?.home, FISH_HOME.tank);
  assert.equal(changeCompanions(tank, { kind: COMPANION_ACTION.share, uid: 'one' }), tank);
  const bag = changeCompanions(tank, { kind: COMPANION_ACTION.bag, uid: 'one' });
  const shared = changeCompanions(bag, { kind: COMPANION_ACTION.share, uid: 'one' });
  assert.deepEqual(shared, { fish: [], friendship: 1 });
  assert.equal(changeCompanions(shared, { kind: COMPANION_ACTION.share, uid: 'one' }), shared);
  assert.equal(first.fish[0]?.home, FISH_HOME.bag);
});

test('full bag or tank preserves all existing fish and permits another disposition', () => {
  let state = EMPTY_COMPANIONS;
  for (let i = 0; i < TANK_CAPACITY; i++) {
    state = keep(state, `tank-${i}`);
    state = changeCompanions(state, { kind: COMPANION_ACTION.tank, uid: `tank-${i}` });
  }
  for (let i = 0; i < BAG_CAPACITY; i++) state = keep(state, `bag-${i}`);
  assert.equal(keep(state, 'overflow'), state);
  assert.equal(changeCompanions(state, { kind: COMPANION_ACTION.tank, uid: 'bag-0' }), state);
  assert.equal(changeCompanions(state, { kind: COMPANION_ACTION.bag, uid: 'tank-0' }), state);
  const shared = changeCompanions(state, { kind: COMPANION_ACTION.share, uid: 'bag-0' });
  assert.equal(
    changeCompanions(shared, { kind: COMPANION_ACTION.bag, uid: 'tank-0' }).fish.length,
    state.fish.length - 1,
  );
});

test('friendship reaches distinct stages, persists and caps without losing the next gifted fish', () => {
  let state = EMPTY_COMPANIONS;
  for (let i = 1; i <= 8; i++) {
    state = changeCompanions(keep(state, `${i}`), { kind: COMPANION_ACTION.share, uid: `${i}` });
    assert.equal(state.friendship, Math.min(i, 5));
    assert.equal(state.fish.length, 0);
    assert.deepEqual(parseCompanions(JSON.stringify(state)), state);
  }
  assert.deepEqual(
    [0, 1, 2, 4, 5].map((n) => catBond(n).level),
    [0, 0, 1, 1, 2],
  );
});

test('save validation rejects invalid sizes, duplicate identities, unknown species and excessive capacity', () => {
  for (const raw of ['{', 'null', '42']) assert.deepEqual(parseCompanions(raw), EMPTY_COMPANIONS);
  const valid = { ...caught, uid: 'one', home: FISH_HOME.tank };
  const data = {
    friendship: 99,
    fish: [
      valid,
      valid,
      { ...valid, uid: 'two', size: 1000 },
      { ...valid, uid: 'three', id: 'shark' },
      { ...valid, uid: 'four', home: 'sea' },
    ],
  };
  assert.deepEqual(parseCompanions(JSON.stringify(data)), { friendship: 5, fish: [valid] });
  assert.equal(
    parseCompanions(JSON.stringify({ fish: Array.from({ length: 50 }, (_, i) => ({ ...valid, uid: `${i}` })) })).fish
      .length,
    TANK_CAPACITY,
  );
});

test('aquarium and cat destinations and every cat approach segment stay on walkable ground', () => {
  for (const [start, target] of [
    [HOME, HOME_AQUARIUM],
    [FISHING_PIER, PIER_CAT],
  ] as const) {
    assert.ok(canWalk(target.x, target.z, target.region));
    assert.ok(findRoute(start, target, target.region).length);
  }
  for (const friendship of [0, 2, 5]) {
    const target = catPosition(friendship, true);
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      assert.ok(canWalk(PIER_CAT.x + (target.x - PIER_CAT.x) * t, PIER_CAT.z + (target.z - PIER_CAT.z) * t, 'coast'));
    }
  }
});

test('world tank displays kept fish, feeding attracts them, cat celebrates and disposal cleans all groups', () => {
  const scene = new THREE.Scene();
  const world = createCompanionScene(scene);
  const state = changeCompanions(keep(EMPTY_COMPANIONS, 'one'), { kind: COMPANION_ACTION.tank, uid: 'one' });
  world.update(0.1, 2, 'home', state, null, 0, false);
  const tank = scene.getObjectByName('home-aquarium')!;
  const fish = scene.getObjectByName('aquarium-fish-0')!;
  const cat = scene.getObjectByName('pier-companion-cat')!;
  assert.equal(tank.visible, true);
  assert.equal(cat.visible, false);
  assert.equal(fish.visible, true);
  assert.equal(scene.getObjectByName('aquarium-fish-1')?.visible, false);
  world.react(COMPANION_REACTION.feed);
  world.update(0.8, 2, 'home', state, null, 0, false);
  assert.ok(fish.position.y >= 5.1);
  const frame: FishingFrame = { phase: FISHING_PHASE.caught, elapsed: 0, tension: 0, progress: 100, isReeling: false };
  world.update(1, 3, 'coast', { ...state, friendship: 5 }, frame, 0, true);
  const baseline = cat.position.y;
  world.update(0, 3, 'coast', { ...state, friendship: 5 }, frame, 0.49, false);
  assert.ok(cat.position.y > baseline);
  assert.equal(tank.visible, false);
  assert.equal(cat.visible, true);
  world.update(0.1, 4, 'village', state, null, 0, false);
  assert.equal(cat.visible, false);
  world.dispose();
  assert.equal(scene.children.length, 0);
});
