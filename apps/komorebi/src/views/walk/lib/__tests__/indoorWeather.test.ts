import assert from 'node:assert/strict';
import test from 'node:test';
import { WORLDS, isIndoors } from '../../model/world/world';
import { INDOOR_RAIN_ROOMS, WINDOW_RAIN_VELOCITY } from '../indoorWeather';

test('every sheltered map has its own outdoor rain mask', () => {
  for (const world of Object.keys(WORLDS)) {
    const room = INDOOR_RAIN_ROOMS.find((room) => room.region === world);
    if (world in WORLDS && (world === 'home' || world === 'hallway' || world === 'classroom')) {
      assert.ok(isIndoors(world));
      assert.ok(room && room.panes.length > 0, `${world} has no window rain`);
    } else assert.equal(room, undefined, `${world} should use the outdoor rain layer`);
  }
});

test('window rain falls down and drifts left in painting coordinates', () => {
  assert.ok(WINDOW_RAIN_VELOCITY.y > 0, 'painting y grows downward');
  assert.ok(WINDOW_RAIN_VELOCITY.x < 0, 'indoor and outdoor rain share their wind direction');
});

test('window polygons remain convex, clockwise in painting coordinates and inside their painting', () => {
  for (const { region, panes } of INDOOR_RAIN_ROOMS) {
    for (const pane of panes) {
      pane.forEach(([x, y]) => {
        assert.ok(x >= 0 && x <= 1536 && y >= 0 && y <= 1024, region);
      });
      pane.forEach((a, index) => {
        const b = pane[(index + 1) % pane.length];
        const c = pane[(index + 2) % pane.length];
        assert.ok(b && c);
        const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
        assert.ok(cross > 0, `${region} has a reversed or concave rain pane`);
      });
    }
  }
});
