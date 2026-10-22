import assert from 'node:assert/strict';
import test from 'node:test';
import { gameKey } from '../src/features/walk/lib/input';

test('movement and shortcuts work with Korean IME and match keyup after language switching', () => {
  for (const [code, key, expected] of [
    ['KeyW', 'ㅈ', 'w'],
    ['KeyA', 'ㅁ', 'a'],
    ['KeyS', 'ㄴ', 's'],
    ['KeyD', 'ㅇ', 'd'],
    ['KeyE', 'ㄷ', 'e'],
    ['KeyM', 'ㅡ', 'm'],
  ]) {
    assert.equal(gameKey({ code: code!, key: key! }), expected);
    assert.equal(gameKey({ code: code!, key: expected!.toUpperCase() }), expected);
  }
  assert.equal(gameKey({ code: 'ArrowUp', key: 'ArrowUp' }), 'arrowup');
  assert.equal(gameKey({ code: 'Space', key: ' ' }), ' ');
});
