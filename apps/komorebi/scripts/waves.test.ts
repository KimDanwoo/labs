import assert from 'node:assert/strict';
import test from 'node:test';
import { waveFrame } from '../src/features/walk/lib/waves';

test('a breaker plays its frames once, then the sea waits for the next wave', () => {
  const breaker = { kind: 'break', period: 6 } as const;
  assert.equal(waveFrame(breaker, 0), 0);
  assert.equal(waveFrame(breaker, 0.5), 4);
  assert.equal(waveFrame(breaker, 1.37), 10);
  assert.equal(waveFrame(breaker, 1.4), null);
  assert.equal(waveFrame(breaker, 5.9), null);
});

test('the shore wash loops through every frame across its period', () => {
  const lace = { kind: 'lace', period: 8 } as const;
  const frames = Array.from({ length: 80 }, (_, i) => waveFrame(lace, (i / 80) * 8));
  assert.deepEqual([...new Set(frames)], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});
