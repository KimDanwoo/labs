import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHARACTER,
  DEFAULT_APPEARANCE,
  characterAtlas,
  parseAppearance,
  sleepingPortrait,
} from '../src/shared/world/appearance';

test('appearance persistence keeps outfits and migrates old characters to the straw-hat child', () => {
  for (const character of [CHARACTER.child, 'boy', 'girl'])
    for (const outfit of ['summer', 'overalls'] as const) {
      const appearance = { character: CHARACTER.child, outfit };
      assert.deepEqual(parseAppearance(JSON.stringify({ character, outfit })), appearance);
      assert.equal(characterAtlas(appearance), `/art/child-straw-hat-${outfit}.webp`);
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
