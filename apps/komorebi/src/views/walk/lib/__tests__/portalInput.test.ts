import assert from 'node:assert/strict';
import test from 'node:test';
import { createPortalInput } from '../portalInput';

test('a held direction cannot immediately walk back through the next doorway, including repeated keyboard and pad input', () => {
  const input = createPortalInput();
  input.arrive(['arrowup', 'w', 'shift']);
  for (let repeat = 0; repeat < 60; repeat++) {
    assert.equal(input.isBlocked('arrowup'), true);
    assert.equal(input.isBlocked('w'), true);
  }
  assert.equal(input.isBlocked('arrowdown'), false);
  assert.equal(input.isBlocked('shift'), false);
  input.release('arrowup');
  assert.equal(input.isBlocked('arrowup'), false);
  assert.equal(input.isBlocked('w'), true);
  input.clear();
  assert.equal(input.isBlocked('w'), false);
});
