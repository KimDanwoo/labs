import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Playlist, type PlaylistHost, type SongStream, type SongStreamHandlers } from '../playlist';

interface FakeStream extends SongStream {
  path: string;
  handlers: SongStreamHandlers;
  isPlaying: boolean;
}

interface FakeTimer {
  seconds: number;
  callback: () => void;
  isKilled: boolean;
}

interface FakeHost extends PlaylistHost {
  log: string[];
  isAllowed: boolean;
  streams: FakeStream[];
  timers: FakeTimer[];
  runTimers: () => void;
}

const SONGS = [
  { path: 'a.mp3', name: 'A' },
  { path: 'b.mp3', name: 'B' },
];

function fakeHost(): FakeHost {
  const host: FakeHost = {
    log: [],
    isAllowed: true,
    streams: [],
    timers: [],
    canPlay: () => host.isAllowed,
    createStream: (path, handlers) => {
      const stream: FakeStream = {
        path,
        handlers,
        isPlaying: false,
        load: () => host.log.push(`load:${path}#${String(host.streams.indexOf(stream))}`),
        play: () => {
          stream.isPlaying = true;
          host.log.push(`play:${path}`);
        },
        pause: () => {
          stream.isPlaying = false;
          host.log.push(`pause:${path}`);
        },
        stop: () => {
          stream.isPlaying = false;
          host.log.push(`stop:${path}`);
        },
        playing: () => stream.isPlaying,
        unload: () => host.log.push(`unload:${path}`),
      };
      host.streams.push(stream);
      return stream;
    },
    delay: (seconds, callback) => {
      const timer: FakeTimer = { seconds, callback, isKilled: false };
      host.timers.push(timer);
      return {
        kill: () => {
          timer.isKilled = true;
        },
      };
    },
    playDiscChange: () => host.log.push('disc'),
    announce: (name) => host.log.push(`announce:${name}`),
    now: () => 0,
    runTimers: () => {
      const due = host.timers.splice(0);
      for (const timer of due) if (!timer.isKilled) timer.callback();
    },
  };
  return host;
}

function latestStream(host: FakeHost, path: string): FakeStream {
  const stream = host.streams.filter((candidate) => candidate.path === path).at(-1);
  assert.ok(stream);
  return stream;
}

describe('Playlist', () => {
  it('곡마다 스트림을 만들고, 현재 시각으로 시작 곡을 고른다', () => {
    const host = fakeHost();
    host.now = () => 3 * 60 * 1000;
    const playlist = new Playlist(SONGS, host);
    playlist.preload();
    assert.deepEqual(
      host.streams.map(({ path }) => path),
      ['a.mp3', 'b.mp3'],
    );
    assert.deepEqual(host.log, ['load:b.mp3#1']);
  });

  it('재생할 수 없으면 resume을 무시하고, 재생 중이면 다시 시작하지 않는다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    host.isAllowed = false;
    playlist.resume();
    assert.deepEqual(host.log, []);
    host.isAllowed = true;
    playlist.resume();
    playlist.resume();
    assert.deepEqual(host.log, ['load:a.mp3#0', 'play:a.mp3']);
    assert.equal(playlist.current?.name, 'A');
  });

  it('불러오기 실패는 3초 뒤 새 스트림으로 다시 재생하고, 버린 스트림의 늦은 콜백은 무시한다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    const broken = latestStream(host, 'a.mp3');
    broken.handlers.onLoadError();
    assert.deepEqual(
      host.timers.map(({ seconds }) => seconds),
      [3],
    );
    host.runTimers();
    const fresh = latestStream(host, 'a.mp3');
    assert.notEqual(fresh, broken);
    assert.deepEqual(host.log.slice(2), ['unload:a.mp3', 'load:a.mp3#2', 'play:a.mp3']);

    broken.handlers.onLoadError();
    broken.handlers.onLoad();
    assert.equal(host.timers.length, 0);
    assert.equal(playlist.songs[0]?.loadState, 'loading');
  });

  it('자동 재시도는 3번까지만 하고, 사용자가 다시 재생하면 횟수를 새로 준다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      latestStream(host, 'a.mp3').handlers.onLoadError();
      host.runTimers();
    }
    latestStream(host, 'a.mp3').handlers.onLoadError();
    assert.equal(host.timers.length, 0);
    assert.equal(playlist.songs[0]?.loadState, 'failed');

    latestStream(host, 'a.mp3').isPlaying = false;
    playlist.resume();
    latestStream(host, 'a.mp3').handlers.onLoadError();
    assert.equal(host.timers.length, 1);
  });

  it('성공하면 재시도 횟수를 0으로 되돌린다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    latestStream(host, 'a.mp3').handlers.onLoadError();
    host.runTimers();
    latestStream(host, 'a.mp3').handlers.onLoad();
    assert.deepEqual([playlist.songs[0]?.loadState, playlist.songs[0]?.loadRetries], ['loaded', 0]);
  });

  it('곡이 끝나면 디스크 소리 → 정지 → 1초 뒤 다음 곡 재생 → 알림', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    latestStream(host, 'a.mp3').handlers.onEnd();
    assert.deepEqual(
      host.timers.map(({ seconds }) => seconds),
      [1],
    );
    host.runTimers();
    assert.deepEqual(host.log.slice(2), ['disc', 'stop:a.mp3', 'load:b.mp3#1', 'play:b.mp3', 'announce:B']);
  });

  it('넘기는 1초 동안의 추가 next는 무시한다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    playlist.next();
    playlist.next();
    assert.equal(host.timers.length, 1);
    assert.deepEqual(host.log.slice(2), ['disc', 'stop:a.mp3']);
  });

  it('넘기는 도중 pause하면 다음 곡을 틀지 않는다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    playlist.next();
    playlist.pause();
    host.runTimers();
    assert.deepEqual(host.log.slice(2), ['disc', 'stop:a.mp3', 'pause:a.mp3']);
  });

  it('넘기는 1초 사이 재생할 수 없게 되면 곡을 바꾸지 않는다', () => {
    const host = fakeHost();
    const playlist = new Playlist(SONGS, host);
    playlist.resume();
    playlist.next();
    host.isAllowed = false;
    host.runTimers();
    assert.equal(playlist.current?.name, 'A');
    assert.deepEqual(host.log.slice(2), ['disc', 'stop:a.mp3']);
  });
});
