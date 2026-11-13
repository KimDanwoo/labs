import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHARACTER,
  DEFAULT_APPEARANCE,
  OUTFIT,
  OUTFIT_DEFINITIONS,
  characterLayers,
  parseAppearance,
  sleepingPortrait,
} from '../appearance';

test('appearance persistence keeps outfits and migrates old characters to the straw-hat child', () => {
  for (const character of Object.values(CHARACTER))
    for (const outfit of Object.values(OUTFIT)) {
      const appearance = { character: CHARACTER.child, outfit };
      assert.deepEqual(parseAppearance(JSON.stringify({ character, outfit })), appearance);
      assert.equal(characterLayers(appearance).body, '/art/child-base-straw-hat-v2.webp');
      assert.equal(characterLayers(appearance).outfit, OUTFIT_DEFINITIONS[outfit].atlas);
      assert.equal(sleepingPortrait(appearance.character), '/art/child-boy-sleep.webp');
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

test('every character equips the same outfit asset while retaining their own body', () => {
  for (const outfit of Object.values(OUTFIT)) {
    const layers = Object.values(CHARACTER).map((character) => characterLayers({ character, outfit }));
    assert.equal(new Set(layers.map((layer) => layer.body)).size, Object.values(CHARACTER).length);
    assert.equal(new Set(layers.map((layer) => layer.outfit)).size, 1);
  }
});
