import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYER_SCREEN } from '../../model/constants/playerScreen';
import { TRACKS } from '../../model/constants/tracks';
import { playerPath, screenFromPath } from '../widget';

test('archive and listening routes can be reopened without losing their screen', () => {
  const track = TRACKS[0];
  assert.ok(track);
  for (const screen of Object.values(PLAYER_SCREEN)) {
    assert.equal(screenFromPath(playerPath(track, screen)), screen);
  }
  assert.equal(playerPath(track, PLAYER_SCREEN.archive), '/');
  assert.equal(playerPath(track, PLAYER_SCREEN.nowPlaying), `/t/${track.id}`);
  assert.equal(playerPath(track, PLAYER_SCREEN.queue), `/t/${track.id}/queue`);
});
