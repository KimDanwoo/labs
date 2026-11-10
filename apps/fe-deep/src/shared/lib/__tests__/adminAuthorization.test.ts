import assert from 'node:assert/strict';
import test from 'node:test';
import { assertAdminUser } from '../adminAuthorization';

test('administrator authorization rejects anonymous and ordinary accounts', () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = ' Admin@Example.com , second@example.com ';
  try {
    for (const user of [null, {}, { email: null }, { email: 'user@example.com' }]) {
      assert.throws(() => assertAdminUser(user), /관리자 권한/);
    }
    assert.doesNotThrow(() => assertAdminUser({ email: 'admin@example.com' }));
    assert.doesNotThrow(() => assertAdminUser({ email: 'SECOND@example.com' }));
  } finally {
    if (previous === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previous;
  }
});
