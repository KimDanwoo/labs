import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invitationUrl, roomFromHash } from '../together';

const room = '1234567890abcdef1234567890abcdef';
test('invitation fragments only accept unguessable room IDs and preserve the current route', () => {
  const href = invitationUrl(room, 'https://walk.example/game/?lang=ko');
  assert.equal(href, `https://walk.example/game/?lang=ko#room=${room}`);
  assert.equal(roomFromHash(new URL(href).hash), room);
  for (const raw of ['#room=public', '#room=../../secret', '#room=javascript:alert(1)', '#room='])
    assert.equal(roomFromHash(raw), null);
  assert.throws(() => invitationUrl(room, 'javascript:alert(1)'));
  assert.throws(() => invitationUrl('../', 'https://walk.example'));
});
