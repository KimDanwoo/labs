import { parseStoredProgress } from '@entities/progress/lib/storedProgress';
import assert from 'node:assert/strict';
import test from 'node:test';

const TODAY = '2026-11-19';
const VALID = {
  question_id: 'q-1',
  status: 'learning',
  correct_count: 1,
  wrong_count: 0,
  last_reviewed: '2026-11-18T09:00:00.000Z',
  easiness_factor: 2.5,
  interval: 1,
  repetition: 0,
  next_review: '2026-11-19',
};

test('a valid record is returned as is and needs no repair', () => {
  const stored = parseStoredProgress(JSON.stringify({ 'q-1': VALID }), TODAY);
  assert.deepEqual(stored, { progress: { 'q-1': VALID }, isRepaired: false });
});

test('one broken entry is dropped without losing the other records', () => {
  const stored = parseStoredProgress(JSON.stringify({ 'q-1': VALID, 'q-2': null, 'q-3': 'oops' }), TODAY);
  assert.deepEqual(stored.progress, { 'q-1': VALID });
  assert.equal(stored.isRepaired, true);
});

test('an entry with wrong field types keeps its valid fields and fills the rest', () => {
  const stored = parseStoredProgress(
    JSON.stringify({ 'q-1': { ...VALID, correct_count: 'two', status: 'gone' } }),
    TODAY,
  );
  assert.deepEqual(stored.progress['q-1'], { ...VALID, correct_count: 0, status: 'learning' });
  assert.equal(stored.isRepaired, true);
});

test('a legacy record without SM-2 fields is migrated', () => {
  const stored = parseStoredProgress(
    JSON.stringify({ 'q-1': { status: 'mastered', last_reviewed: VALID.last_reviewed } }),
    TODAY,
  );
  assert.deepEqual(stored.progress['q-1'], {
    question_id: 'q-1',
    status: 'mastered',
    correct_count: 0,
    wrong_count: 0,
    last_reviewed: VALID.last_reviewed,
    easiness_factor: 2.5,
    interval: 6,
    repetition: 2,
    next_review: TODAY,
  });
});

test('unreadable storage yields an empty record without a repair write', () => {
  assert.deepEqual(parseStoredProgress('{not json', TODAY), { progress: {}, isRepaired: false });
  assert.deepEqual(parseStoredProgress('[1,2]', TODAY), { progress: {}, isRepaired: false });
  assert.deepEqual(parseStoredProgress(null, TODAY), { progress: {}, isRepaired: false });
});
