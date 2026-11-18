import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceClock, estimatePosition, type PositionReport } from '../playbackClock';

type ClockFrame = Parameters<typeof advanceClock>[0];

const NOW = 100_000;
const FRAME_MS = 16;
const liveReport = (ms: number, ageMs = 0): PositionReport => ({ ms, at: NOW - ageMs, live: true });
const frame = (overrides: Partial<ClockFrame> & Pick<ClockFrame, 'report'>): ClockFrame => ({
  smoothMs: 0,
  delta: FRAME_MS,
  isPlaying: true,
  now: NOW,
  ...overrides,
});

test('a paused or not-yet-live clock stays pinned to the reported position', () => {
  assert.equal(advanceClock(frame({ smoothMs: 900, report: liveReport(5_000, 400), isPlaying: false })), 5_000);
  assert.equal(advanceClock(frame({ smoothMs: 900, report: { ...liveReport(5_000, 400), live: false } })), 5_000);
  assert.equal(estimatePosition(liveReport(5_000, 400), false, NOW), 5_000);
});

test('while playing, the estimate adds the time elapsed since the last report', () => {
  assert.equal(estimatePosition(liveReport(5_000, 400), true, NOW), 5_400);
});

test('a stalled report stops advancing after three seconds', () => {
  assert.equal(estimatePosition(liveReport(5_000, 60_000), true, NOW), 8_000);
});

test('small drift is corrected by at most 30% of the frame time, in either direction', () => {
  const report = liveReport(5_000);
  assert.equal(advanceClock(frame({ smoothMs: 4_900, report })), 4_900 + FRAME_MS + FRAME_MS * 0.3);
  assert.equal(advanceClock(frame({ smoothMs: 5_100, report })), 5_100 + FRAME_MS - FRAME_MS * 0.3);
});

test('drift within the correction bound lands exactly on the target', () => {
  assert.equal(advanceClock(frame({ smoothMs: 4_986, report: liveReport(5_000) })), 5_000);
});

test('drift beyond 250ms is treated as a seek and snaps to the target', () => {
  assert.equal(advanceClock(frame({ smoothMs: 1_000, report: liveReport(5_000, 200) })), 5_200);
});
