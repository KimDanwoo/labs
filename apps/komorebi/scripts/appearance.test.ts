import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_APPEARANCE, characterAtlas, parseAppearance, sleepingPortrait } from '../src/shared/world/appearance';

test('appearance persistence accepts only shipped character and outfit combinations', () => {
  for (const character of ['boy', 'girl'] as const)
    for (const outfit of ['summer', 'overalls'] as const) {
      const appearance = { character, outfit };
      assert.deepEqual(parseAppearance(JSON.stringify(appearance)), appearance);
      assert.equal(characterAtlas(appearance), `/art/child-${character}-${outfit}.webp`);
      assert.equal(sleepingPortrait(character), `/art/child-${character}-sleep.webp`);
    }
  for (const value of [
    null,
    '{',
    '{}',
    '{"character":"../private","outfit":"summer"}',
    '{"character":"girl","outfit":"hood"}',
  ])
    assert.deepEqual(parseAppearance(value), DEFAULT_APPEARANCE);
});
