import assert from 'node:assert/strict';
import test from 'node:test';
import { diaryMemory, liveMemory } from '../src/features/walk/lib/memory';
import { LANDMARKS } from '../src/shared/world/world';

const landmark = LANDMARKS[0]!;

test('a discovery shows what the place looks like right now', () => {
  assert.deepEqual(liveMemory(landmark, false).pages, [{ label: '한낮', text: landmark.text }]);
  assert.deepEqual(liveMemory(landmark, true).pages, [{ label: '해 질 녘', text: landmark.eveningText }]);
});

test('the diary adds the dusk page only once it has been seen', () => {
  assert.equal(diaryMemory(landmark, false).pages.length, 1);
  assert.deepEqual(
    diaryMemory(landmark, true).pages.map((page) => page.text),
    [landmark.text, landmark.eveningText],
  );
});

test('every place has its own dusk text', () => {
  for (const place of LANDMARKS) {
    const dusk: string = place.eveningText;
    assert.ok(dusk.length > 0);
    assert.notEqual(dusk, place.text);
  }
});
