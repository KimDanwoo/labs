import { FIRST_DAY } from '@views/walk/lib/dayCycle';
import { parseVillageDay } from '@views/walk/model/store/villageDay';
import assert from 'node:assert/strict';
import test from 'node:test';

test('saved days preserve the date, light and weather without trusting malformed storage', () => {
  assert.deepEqual(parseVillageDay('{"day":8,"time":"night","weather":"rain"}'), {
    day: 8,
    time: 'night',
    weather: 'rain',
  });
  for (const raw of [
    null,
    '',
    'broken',
    'null',
    '[]',
    '{}',
    '{"day":0,"time":"day","weather":"clear"}',
    '{"day":1.5,"time":"day","weather":"clear"}',
    '{"day":1000000,"time":"day","weather":"clear"}',
    '{"day":2,"time":"midnight","weather":"clear"}',
    '{"day":2,"time":"night","weather":"thunder"}',
  ]) {
    assert.deepEqual(parseVillageDay(raw), FIRST_DAY, String(raw));
  }
});
