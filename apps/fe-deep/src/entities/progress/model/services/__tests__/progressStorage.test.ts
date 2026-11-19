import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { localDateKey } from '../../../lib/progressDates';
import { getStudyHeatmap, updateQuestionProgress } from '../progressRecords';
import { getLocalProgress, saveLocalProgress } from '../progressStorage';

function mockBrowserStorage(t: TestContext, values: Map<string, string>) {
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

test('local progress remains safe on the server without browser storage', () => {
  assert.deepEqual(getLocalProgress(), {});
  assert.doesNotThrow(() => saveLocalProgress({}));
});

test('legacy progress migrates locally and heatmaps preserve its reviewed day', (t) => {
  const values = new Map([
    ['fe-interview-progress', JSON.stringify({ 'q-1': { status: 'mastered', last_reviewed: '2026-10-01T12:00:00Z' } })],
  ]);
  mockBrowserStorage(t, values);
  const progress = getLocalProgress();
  const migrated = progress['q-1']!;
  assert.equal(migrated.question_id, 'q-1');
  assert.equal(migrated.easiness_factor, 2.5);
  assert.equal(migrated.status, 'mastered');
  assert.deepEqual(getStudyHeatmap(progress), { [localDateKey(new Date('2026-10-01T12:00:00Z'))]: 1 });
  assert.equal(JSON.parse(values.get('fe-interview-progress')!)['q-1'].question_id, 'q-1');
});

test('a broken saved entry does not wipe the other records when a card is studied', (t) => {
  const kept = {
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
  const values = new Map([['fe-interview-progress', JSON.stringify({ 'q-1': kept, 'q-2': null })]]);
  mockBrowserStorage(t, values);
  updateQuestionProgress('q-9', true);
  const saved = JSON.parse(values.get('fe-interview-progress')!);
  assert.deepEqual(Object.keys(saved).sort(), ['q-1', 'q-9']);
  assert.deepEqual(saved['q-1'], kept);
});
