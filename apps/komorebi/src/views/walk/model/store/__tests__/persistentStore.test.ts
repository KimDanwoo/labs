import { createPersistentStore } from '@views/walk/model/store/persistentStore';
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

const KEY = 'test-key';

function installStorage(setItem: (key: string, value: string) => void) {
  Object.defineProperty(globalThis, 'localStorage', { value: { setItem }, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

test('reads storage once and falls back when reading throws', () => {
  let reads = 0;
  const store = createPersistentStore({
    key: KEY,
    read: () => {
      reads += 1;
      throw new Error('blocked');
    },
    fallback: { count: 0 },
  });
  assert.deepEqual(store.get(), { count: 0 });
  assert.equal(store.get(), store.get());
  assert.equal(reads, 1);
  assert.deepEqual(store.getServer(), { count: 0 });
});

test('set saves, updates the value and notifies subscribers until they leave', () => {
  const saved = new Map<string, string>();
  installStorage((key, value) => saved.set(key, value));
  const store = createPersistentStore({ key: KEY, read: () => ({ count: 1 }), fallback: { count: 0 } });
  let notified = 0;
  const leave = store.subscribe(() => {
    notified += 1;
  });
  assert.equal(store.set({ count: 2 }), true);
  assert.deepEqual(store.get(), { count: 2 });
  assert.equal(saved.get(KEY), '{"count":2}');
  leave();
  store.set({ count: 3 });
  assert.equal(notified, 1);
});

test('a blocked storage keeps the value for this visit and reports it was not saved', () => {
  installStorage(() => {
    throw new Error('quota');
  });
  const store = createPersistentStore({ key: KEY, read: () => 'old', fallback: '', serialize: (value) => value });
  assert.equal(store.set('new'), false);
  assert.equal(store.get(), 'new');
});
