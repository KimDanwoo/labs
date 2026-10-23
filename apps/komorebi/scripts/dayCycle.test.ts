import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_DAY, wakeFromSleep, weatherAfterRest, weatherDelay } from '../src/features/walk/lib/dayCycle';
import { TIME, WEATHER } from '../src/features/walk/model/constants';

test('sleep advances the light, and only sleeping through the night starts a new day', () => {
  const dusk = wakeFromSleep(FIRST_DAY, 0.8);
  const night = wakeFromSleep(dusk, 0.1);
  const morning = wakeFromSleep(night, 0.8);
  assert.deepEqual([dusk.time, night.time, morning.time], [TIME.evening, TIME.night, TIME.day]);
  assert.deepEqual([dusk.day, night.day, morning.day], [1, 1, 2]);
  assert.equal(night.weather, WEATHER.rain);
  assert.equal(morning.weather, WEATHER.clear);
  assert.equal(FIRST_DAY.day, 1);
});

test('random weather has clear and rainy outcomes, with bounded shower duration', () => {
  assert.equal(weatherAfterRest(0), WEATHER.rain);
  assert.equal(weatherAfterRest(0.99), WEATHER.clear);
  assert.ok(weatherDelay(WEATHER.rain, 0.99) < weatherDelay(WEATHER.clear, 0));
  assert.ok(weatherDelay(WEATHER.rain, 0) >= 45_000);
});
