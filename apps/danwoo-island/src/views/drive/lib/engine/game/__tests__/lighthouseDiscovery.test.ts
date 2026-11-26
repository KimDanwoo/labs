import assert from 'node:assert/strict';
import { it } from 'node:test';

import { availablePlaces } from '@views/drive/lib/engine/game/islandPlaces';
import { Water } from '@views/drive/lib/engine/game/water';

it('밸브를 돌릴 때마다 등대와 목적지가 함께 열리고 닫힌다', () => {
  const water = new Water();
  const isListed = () =>
    availablePlaces(water.isLighthouseAccessible).some((place) => place.respawnName === 'lighthouse');
  water.advance(10);
  assert.equal(isListed(), false);
  assert.equal(water.tide.value, 0);
  water.toggleTide();
  water.advance(1);
  assert.equal(isListed(), false);
  water.toggleTide();
  water.advance(10);
  assert.equal(water.tide.value, 0);
  assert.equal(isListed(), false);
  water.toggleTide();
  water.advance(10);
  assert.equal(isListed(), true);
  water.toggleTide();
  assert.equal(isListed(), false);
  water.advance(1);
  assert.equal(water.tide.value, 0.75);
  water.toggleTide();
  water.advance(10);
  assert.equal(isListed(), true);
  water.toggleTide();
  water.advance(10);
  assert.equal(water.tide.value, 0);
  assert.equal(isListed(), false);
});
