import { addDays, localDateKey } from '@entities/progress/lib/progressDates';
import { getStudyHeatmap, updateQuestionProgress } from '@entities/progress/model/services/progressRecords';
import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';

function useMemoryStorage(t: TestContext): void {
  const values = new Map<string, string>();
  const names = ['window', 'localStorage'];
  const previous = names.map((name) => ({ name, descriptor: Object.getOwnPropertyDescriptor(globalThis, name) }));
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  t.after(() => {
    for (const { name, descriptor } of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
}

test('heatmap counts a review on the local calendar day, not the UTC day', () => {
  const earlyMorning = new Date(2026, 10, 19, 1, 30);
  const heatmap = getStudyHeatmap({
    'q-1': {
      question_id: 'q-1',
      status: 'learning',
      correct_count: 0,
      wrong_count: 1,
      last_reviewed: earlyMorning.toISOString(),
      easiness_factor: 2.5,
      interval: 1,
      repetition: 0,
      next_review: '2026-11-20',
    },
  });
  assert.deepEqual(heatmap, { '2026-11-19': 1 });
});

test('date keys and day arithmetic follow the local calendar', () => {
  assert.equal(localDateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(addDays('2026-11-30', 3), '2026-12-03');
});

test('a wrong answer demotes a mastered question until it is answered right three times in a row again', (t) => {
  useMemoryStorage(t);
  for (let i = 0; i < 3; i++) updateQuestionProgress('q-1', true);
  assert.equal(updateQuestionProgress('q-1', true).status, 'mastered');

  const missed = updateQuestionProgress('q-1', false);
  assert.equal(missed.status, 'learning');
  assert.equal(missed.correct_count, 0);
  assert.equal(missed.wrong_count, 1);

  updateQuestionProgress('q-1', true);
  assert.equal(updateQuestionProgress('q-1', true).status, 'learning');
  assert.equal(updateQuestionProgress('q-1', true).status, 'mastered');
});
