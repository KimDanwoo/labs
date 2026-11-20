import { REWIND_TOLERANCE_MS, REWIND_WATCH_MS } from '@views/player/config/playback';
import { hasLostRewind, isRewindWatched } from '@views/player/lib/rewindGuard';
import assert from 'node:assert/strict';
import test from 'node:test';

const pending = { ms: 0, since: 1000, attempts: 0 };

test('a position that advanced with the clock keeps the rewind', () => {
  assert.equal(hasLostRewind(pending, 400, 1400), false);
  assert.equal(hasLostRewind(pending, 0, 1000), false);
});

test('the widget jumping back to its remembered spot loses the rewind', () => {
  assert.equal(hasLostRewind(pending, 87_061, 1020), true);
  assert.equal(hasLostRewind(pending, REWIND_TOLERANCE_MS + 1, 1000), true);
});

test('the watch ends after the window', () => {
  assert.equal(isRewindWatched(pending, 1000 + REWIND_WATCH_MS), true);
  assert.equal(isRewindWatched(pending, 1001 + REWIND_WATCH_MS), false);
});
