import { diaryMemory, liveMemory } from '@views/walk/lib/memory';
import { LANDMARKS } from '@views/walk/model/world/world';
import assert from 'node:assert/strict';
import test from 'node:test';

const landmark = LANDMARKS[0]!;

test('a discovery shows what the place looks like right now', () => {
  assert.deepEqual(liveMemory(landmark, 'day').pages, [{ label: '한낮', text: landmark.text }]);
  assert.deepEqual(liveMemory(landmark, 'evening').pages, [{ label: '해 질 녘', text: landmark.eveningText }]);
  assert.deepEqual(liveMemory(landmark, 'night').pages, [{ label: '밤', text: landmark.nightText }]);
});

test('the diary shows only the pages kept, in the order of the day', () => {
  assert.deepEqual(
    diaryMemory(landmark, ['night', 'day']).pages.map((page) => page.label),
    ['한낮', '밤'],
  );
  assert.deepEqual(
    diaryMemory(landmark, ['night']).pages.map((page) => page.text),
    [landmark.nightText],
  );
});

test('every place reads differently at each time of day', () => {
  for (const place of LANDMARKS) {
    const texts: string[] = [place.text, place.eveningText, place.nightText];
    assert.equal(new Set(texts).size, 3);
  }
});
