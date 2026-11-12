import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBandSignals, parseWaveform } from '../signals';

const bands = {
  fps: 43,
  audioMs: 1000,
  low: 'AAAA',
  mid: 'AAAA',
  high: 'AAAA',
  beats: [
    [0, 0],
    [500, 255],
  ],
};
test('rejects malformed spectral data before decoding or advancing the beat cursor', () => {
  assert.ok(parseBandSignals(bands));
  for (const value of [
    null,
    { ...bands, fps: Infinity },
    { ...bands, low: '*' },
    {
      ...bands,
      beats: [
        [500, 255],
        [0, 10],
      ],
    },
    { ...bands, beats: [[2000, 255]] },
  ])
    assert.equal(parseBandSignals(value), null);
});
test('waveform values must be finite non-negative samples', () => {
  assert.deepEqual([...parseWaveform({ samples: [0, 5, 10], height: 10 })], [0, 0.5, 1]);
  for (const value of [{ samples: [] }, { samples: [NaN] }, { samples: ['1'] }, { samples: [-1] }, null])
    assert.throws(() => parseWaveform(value));
});
