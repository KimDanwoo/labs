import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchCatalog, mergeCatalog, renderCatalog, toTrack } from '../catalog.mjs';

const raw = (id) => ({
  id,
  title: `곡 ${id}`,
  duration: 1000,
  artwork_url: 'https://i1.sndcdn.com/a-large.jpg',
  permalink_url: `https://soundcloud.com/danwooking/${id}`,
  waveform_url: 'https://wave.sndcdn.com/a.json',
  genre: 'R&B',
  description: '소개',
});
const firstUrl = 'https://api-v2.soundcloud.com/users/1/tracks';

test('fetches every page and deduplicates overlapping tracks', async () => {
  const tracks = await fetchCatalog({
    firstUrl,
    getJson: async (url) =>
      url === firstUrl
        ? { collection: [raw(1), raw(2)], next_href: `${firstUrl}?page=2` }
        : { collection: [raw(2), raw(3)], next_href: null },
  });
  assert.deepEqual(
    tracks.map((track) => track.id),
    [1, 2, 3],
  );
});
test('rejects partial fetches, foreign URLs and pagination loops', async () => {
  await assert.rejects(
    fetchCatalog({
      firstUrl,
      getJson: async (url) => {
        if (url !== firstUrl) throw new Error('offline');
        return { collection: [raw(1)], next_href: `${firstUrl}?page=2` };
      },
    }),
  );
  for (const next_href of [firstUrl, 'https://evil.example/next', 'https://user:password@api-v2.soundcloud.com/next']) {
    await assert.rejects(fetchCatalog({ firstUrl, getJson: async () => ({ collection: [raw(1)], next_href }) }));
  }
});
test('retains removed tracks and restores them when they return', () => {
  const prior = [toTrack(raw(1)), toTrack(raw(2))];
  const next = mergeCatalog([toTrack(raw(2))], prior);
  assert.equal(next.find((track) => track.id === 1)?.isAvailable, false);
  assert.equal(next.find((track) => track.id === 1)?.permalinkUrl, prior[0].permalinkUrl);
  const restored = mergeCatalog([toTrack(raw(1)), toTrack(raw(2))], next);
  assert.equal(restored.length, 2);
  assert.equal(restored[0].isAvailable, true);
});
test('rejects unsafe external data and empty catalog replacement', async () => {
  assert.throws(() => toTrack({ ...raw(1), permalink_url: 'javascript:alert(1)' }));
  assert.throws(() => toTrack({ ...raw(1), duration: NaN }));
  await assert.rejects(fetchCatalog({ firstUrl, getJson: async () => ({ collection: [] }) }));
});
test('generated source safely preserves quotes, newlines and backslashes', () => {
  const track = toTrack({ ...raw(1), title: `It's "music" \\ today`, description: '첫 줄\n둘째 줄' });
  const source = renderCatalog([track]);
  assert.ok(source.includes("It\\'s"));
  assert.ok(source.includes('첫 줄\\n둘째 줄'));
});
