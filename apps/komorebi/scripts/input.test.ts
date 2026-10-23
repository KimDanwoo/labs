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

test('thumbstick supports all directions, a dead zone and a neutral release', async () => {
  const { padDirection } = await import('../src/features/walk/lib/input');
  assert.deepEqual(padDirection(0, 0), []);
  assert.deepEqual(padDirection(0.1, 0.1), []);
  assert.deepEqual(padDirection(1, 0), ['d']);
  assert.deepEqual(padDirection(-1, 0), ['a']);
  assert.deepEqual(padDirection(0, -1), ['w']);
  assert.deepEqual(padDirection(0, 1), ['s']);
  assert.deepEqual(padDirection(1, -1), ['d', 'w']);
  assert.deepEqual(padDirection(-1, 1), ['a', 's']);
});

test('keys on focused controls are left to the control', async () => {
  const { isControlTarget } = await import('../src/features/walk/lib/input');
  for (const tagName of ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A']) {
    assert.equal(isControlTarget({ tagName, isContentEditable: false }), true);
  }
  assert.equal(isControlTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isControlTarget({ tagName: 'CANVAS', isContentEditable: false }), false);
  assert.equal(isControlTarget({ tagName: 'BODY', isContentEditable: false }), false);
});
