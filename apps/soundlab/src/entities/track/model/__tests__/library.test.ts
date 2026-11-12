import { createStore } from 'jotai';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearHistoryAtom,
  libraryAtom,
  LISTEN_SOURCE,
  parseLibrary,
  recordListeningAtom,
  toggleFavoriteAtom,
} from '../library';

test('malformed persisted data is narrowed, bounded and deduplicated', () => {
  const library = parseLibrary({
    favorites: [1, 1, -2, '3', NaN],
    recent: Array.from({ length: 100 }, (_, i) => i + 1),
    listenedMs: Infinity,
    collectionMs: -1,
  });
  assert.deepEqual(library.favorites, [1]);
  assert.equal(library.recent.length, 30);
  assert.equal(library.listenedMs, 0);
  assert.equal(library.collectionMs, 0);
  assert.deepEqual(parseLibrary(null).favorites, []);
});
test('history survives a storage failure in memory and clearing keeps favorites', () => {
  const store = createStore();
  store.set(toggleFavoriteAtom, 7);
  store.set(recordListeningAtom, { id: 7, elapsedMs: 5000, source: LISTEN_SOURCE.collection });
  store.set(recordListeningAtom, { id: 8, elapsedMs: 2000, source: LISTEN_SOURCE.all });
  assert.deepEqual(store.get(libraryAtom).recent, [8, 7]);
  assert.equal(store.get(libraryAtom).listenedMs, 7000);
  assert.equal(store.get(libraryAtom).collectionMs, 5000);
  store.set(clearHistoryAtom);
  assert.deepEqual(store.get(libraryAtom).favorites, [7]);
  assert.deepEqual(store.get(libraryAtom).recent, []);
});
