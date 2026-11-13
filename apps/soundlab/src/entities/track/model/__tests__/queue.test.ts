import assert from 'node:assert/strict';
import test from 'node:test';
import { adjacentTrack, resolveQueue } from '../queue';
import type { Track } from '../types/track';

const tracks: Track[] = [1, 2, 3].map((id) => ({
  id,
  title: String(id),
  durationMs: 1000,
  genre: '',
  permalinkUrl: '',
  artworkBase: '',
  artworkExt: '.jpg',
  waveformUrl: '',
  isAvailable: id !== 2,
}));
test('queue preserves requested order and skips unavailable, missing and duplicate tracks', () => {
  assert.deepEqual(resolveQueue(tracks, [3, 2, 99, 1, 3]), [3, 1]);
  assert.equal(adjacentTrack({ ids: [3, 1], currentId: 3, direction: 1 }), 1);
  assert.equal(adjacentTrack({ ids: [3, 1], currentId: 3, direction: -1 }), 1);
});
test('shuffle never repeats the current track and handles singleton and empty lists', () => {
  assert.equal(adjacentTrack({ ids: [3, 1], currentId: 3, direction: 1, random: 0.99 }), 1);
  assert.equal(adjacentTrack({ ids: [1], currentId: 1, direction: 1, random: 0.5 }), 1);
  assert.equal(adjacentTrack({ ids: [], currentId: 1, direction: 1 }), undefined);
});
