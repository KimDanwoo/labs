import assert from 'node:assert/strict';
import test from 'node:test';
import { getStudyHeatmap } from '../progressApi';
import { getLocalProgress, saveLocalProgress } from '../progressStorage';

test('local progress remains safe on the server without browser storage', () => {
  assert.deepEqual(getLocalProgress(), {});
  assert.doesNotThrow(() => saveLocalProgress({}));
});

test('legacy progress migrates locally and heatmaps preserve its reviewed day', (t) => {
  const values = new Map([
    ['fe-interview-progress', JSON.stringify({ 'q-1': { status: 'mastered', last_reviewed: '2026-10-01T12:00:00Z' } })],
  ]);
  const names = ['window', 'localStorage'];
  const previous = names.map((name) => ({ name, descriptor: Object.getOwnPropertyDescriptor(globalThis, name) }));
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  t.after(() => {
    for (const { name, descriptor } of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  const progress = getLocalProgress();
  const migrated = progress['q-1']!;
  assert.equal(migrated.question_id, 'q-1');
  assert.equal(migrated.easiness_factor, 2.5);
  assert.equal(migrated.status, 'mastered');
  assert.deepEqual(getStudyHeatmap(progress), { '2026-10-01': 1 });
  assert.equal(JSON.parse(values.get('fe-interview-progress')!)['q-1'].question_id, 'q-1');
});
