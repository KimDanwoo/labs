import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MESSAGE,
  NICKNAME_MAX_LENGTH,
  nicknameIsValid,
  parseClientMessage,
  parseServerMessage,
  type Peer,
  type Walker,
} from '../protocol';

const walker: Walker = {
  region: 'village',
  x: 50,
  z: 70,
  heading: 0,
  isWalking: false,
  isRunning: false,
  jumpHeight: 0,
  outfit: 'summer',
};
const peer: Peer = { id: '12345678-1234-1234-1234-123456789012', nickname: '여름', walker };

test('nickname accepts Korean and emoji and rejects hidden characters and excessive length', () => {
  assert.equal(nicknameIsValid('🌿여름'), true);
  for (const value of ['', ' 여름', '여름\n', '여\u202E름', '가'.repeat(NICKNAME_MAX_LENGTH + 1), null])
    assert.equal(nicknameIsValid(value), false);
});
test('client protocol rejects invalid regions, outfit URLs, coordinates, flags and oversized payloads', () => {
  assert.ok(parseClientMessage(JSON.stringify({ type: MESSAGE.move, walker })));
  for (const invalid of [
    { region: '__proto__' },
    { outfit: 'https://evil.test/image' },
    { x: -1 },
    { z: 101 },
    { heading: 8 },
    { isWalking: 'yes' },
    { jumpHeight: 99 },
    { x: null },
  ])
    assert.equal(parseClientMessage(JSON.stringify({ type: MESSAGE.move, walker: { ...walker, ...invalid } })), null);
  for (const raw of [null, 'invalid', '{"type":"move"}', ' '.repeat(2_049), new ArrayBuffer(8)])
    assert.equal(parseClientMessage(raw), null);
});
test('joining requires a validated nickname and climate', () => {
  const hello = { type: MESSAGE.hello, walker, nickname: '여름', climate: { time: 'day', weather: 'clear' } };
  assert.ok(parseClientMessage(JSON.stringify(hello)));
  assert.equal(parseClientMessage(JSON.stringify({ ...hello, climate: { time: 'sunny', weather: 'clear' } })), null);
  assert.equal(parseClientMessage(JSON.stringify({ ...hello, nickname: '' })), null);
});
test('client frames discard unknown properties before broadcasting to a room', () => {
  const result = parseClientMessage(
    JSON.stringify({ type: MESSAGE.move, walker: { ...walker, extra: 'x'.repeat(1_500) } }),
  );
  assert.deepEqual(result, { type: MESSAGE.move, walker });
});
test('server protocol rejects duplicate peers, excess capacity and a welcome for a missing self', () => {
  const welcome = { type: MESSAGE.welcome, id: peer.id, peers: [peer], climate: { time: 'day', weather: 'rain' } };
  assert.ok(parseServerMessage(JSON.stringify(welcome)));
  assert.equal(parseServerMessage(JSON.stringify({ ...welcome, id: 'absent' })), null);
  assert.equal(parseServerMessage(JSON.stringify({ ...welcome, peers: [peer, peer] })), null);
  assert.equal(parseServerMessage(JSON.stringify({ ...welcome, peers: Array(5).fill(peer) })), null);
});
