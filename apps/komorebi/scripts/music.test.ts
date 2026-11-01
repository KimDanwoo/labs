import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DANWOO_PROFILE,
  DEFAULT_MUSIC,
  bindMusicWidget,
  musicSource,
  musicTime,
  musicWidgetSrc,
  parseMusicPreferences,
  parseMusicTracks,
  type MusicWidget,
  type WidgetPayload,
} from '../src/features/music/lib/soundcloud';

test('only DANWOO public profile and playlist links become embed sources', () => {
  assert.equal(musicSource(`${DANWOO_PROFILE}/`), DANWOO_PROFILE);
  assert.equal(musicSource(`${DANWOO_PROFILE}/sets/night-walk?si=abc`), `${DANWOO_PROFILE}/sets/night-walk`);
  for (const url of [
    'javascript:alert(1)',
    'https://soundcloud.com.evil.test/danwooking',
    'https://soundcloud.com/other/sets/music',
    'https://user:pass@soundcloud.com/danwooking',
    `${DANWOO_PROFILE}/run`,
    'http://soundcloud.com/danwooking',
  ])
    assert.equal(musicSource(url), null);
  const embed = new URL(musicWidgetSrc('https://bad.example'));
  assert.equal(embed.origin, 'https://w.soundcloud.com');
  assert.equal(embed.searchParams.get('url'), DANWOO_PROFILE);
  assert.equal(embed.searchParams.get('auto_play'), 'false');
});
test('music preferences tolerate corrupt storage and do not persist playback permission', () => {
  for (const value of [null, '{', '42', 'null']) assert.deepEqual(parseMusicPreferences(value), DEFAULT_MUSIC);
  assert.deepEqual(parseMusicPreferences('{"volume":999,"source":"https://bad.example","isPlaying":true}'), {
    volume: 100,
    source: DANWOO_PROFILE,
  });
  assert.equal(parseMusicPreferences('{"volume":-10}').volume, 0);
  assert.deepEqual(parseMusicPreferences(JSON.stringify({ volume: 42, source: `${DANWOO_PROFILE}/sets/night` })), {
    volume: 42,
    source: `${DANWOO_PROFILE}/sets/night`,
  });
});
test('sound parsing retains original widget indices and rejects untrusted links', () => {
  const tracks = parseMusicTracks([
    null,
    { id: 42, title: 'Deep Blue', duration: 211206, permalink_url: `${DANWOO_PROFILE}/deep-blue` },
    { id: 43, title: 'Run', permalink_url: 'javascript:alert(1)' },
  ]);
  assert.deepEqual(
    tracks.map((track) => track.index),
    [1, 2],
  );
  assert.equal(tracks[0]?.url, `${DANWOO_PROFILE}/deep-blue`);
  assert.equal(tracks[1]?.url, DANWOO_PROFILE);
  assert.equal(musicTime(211206), '3:31');
  assert.equal(musicTime(Infinity), '0:00');
});
test('widget waits for a gesture, follows native events, never double-skips and ignores late callbacks', () => {
  const handlers = new Map<string, (payload: WidgetPayload) => void>();
  const events = Object.fromEntries(
    ['READY', 'PLAY', 'PAUSE', 'PLAY_PROGRESS', 'FINISH', 'ERROR'].map((name) => [name, name]),
  );
  let plays = 0,
    skips = 0,
    pauses = 0,
    volume = -1,
    index = -1,
    progress = -1,
    playing = false,
    errors = 0,
    count = 0;
  const pending: Array<(index: number) => void> = [];
  const widget: MusicWidget = {
    bind: (name, callback) => {
      handlers.set(name, callback);
    },
    unbind: (name) => {
      handlers.delete(name);
    },
    play: () => {
      plays++;
    },
    pause: () => {
      pauses++;
    },
    prev: () => {},
    next: () => {
      skips++;
    },
    skip: () => {
      skips++;
    },
    seekTo: () => {},
    setVolume: (value) => {
      volume = value;
    },
    getSounds: (callback) =>
      callback([
        { id: 1, title: 'One' },
        { id: 2, title: 'Two' },
      ]),
    getCurrentSoundIndex: (callback) => {
      pending.push(callback);
    },
    isPaused: (callback) => callback(false),
  };
  const dispose = bindMusicWidget(
    widget,
    events,
    {
      ready: (tracks) => {
        count = tracks.length;
      },
      playing: (value) => {
        playing = value;
      },
      track: (value) => {
        index = value;
      },
      progress: (value) => {
        progress = value;
      },
      error: () => {
        errors++;
      },
    },
    35,
  );
  handlers.get('READY')!({});
  assert.equal(count, 2);
  assert.equal(volume, 35);
  assert.equal(plays, 0);
  handlers.get('PLAY')!({});
  assert.equal(playing, true);
  pending[1]!(1);
  pending[0]!(0);
  assert.equal(index, 1);
  handlers.get('PLAY_PROGRESS')!({ currentPosition: 1200 });
  assert.equal(progress, 1200);
  handlers.get('PLAY_PROGRESS')!({ currentPosition: NaN });
  assert.equal(progress, 1200);
  handlers.get('FINISH')!({});
  assert.equal(skips, 0);
  assert.equal(playing, false);
  handlers.get('PLAY')!({});
  handlers.get('ERROR')!({});
  assert.equal(errors, 1);
  assert.equal(playing, false);
  const stale = handlers.get('PLAY_PROGRESS')!;
  dispose();
  stale({ currentPosition: 9999 });
  pending[2]!(9);
  assert.equal(progress, 1200);
  assert.equal(index, 1);
  assert.equal(pauses, 1);
  assert.equal(handlers.size, 0);
});

test('disposal remains safe when SoundCloud posts to an already detached iframe', () => {
  const released: string[] = [];
  const widget: MusicWidget = {
    bind: () => {},
    unbind: (event) => {
      released.push(event);
      if (event === 'READY') throw new Error('detached');
    },
    play: () => {},
    pause: () => {
      throw new Error('null postMessage');
    },
    prev: () => {},
    next: () => {},
    skip: () => {},
    seekTo: () => {},
    setVolume: () => {},
    getSounds: () => {},
    getCurrentSoundIndex: () => {},
    isPaused: () => {},
  };
  const dispose = bindMusicWidget(
    widget,
    { READY: 'READY', PLAY: 'PLAY', PAUSE: 'PAUSE' },
    { ready: () => {}, playing: () => {}, track: () => {}, progress: () => {}, error: () => {} },
    35,
  );
  assert.doesNotThrow(dispose);
  assert.deepEqual(released, ['READY', 'PLAY', 'PAUSE']);
});
