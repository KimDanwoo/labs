import { formatDurationMs, formatSeconds } from '@views/player/lib/formatTrack';
import assert from 'node:assert/strict';
import test from 'node:test';

test('track length and the playback bar show the same truncated seconds', () => {
  const durationMs = 200_600;
  assert.equal(formatDurationMs(durationMs), '3:20');
  assert.equal(formatSeconds(durationMs / 1000), formatDurationMs(durationMs));
});

test('invalid durations read as zero', () => {
  assert.equal(formatDurationMs(Number.NaN), '0:00');
  assert.equal(formatDurationMs(-1), '0:00');
});
