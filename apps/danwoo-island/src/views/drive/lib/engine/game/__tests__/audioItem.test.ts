import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AudioGroup, AudioItem, type SoundHost, type SoundOptions, type SoundPlayer } from '../audioItem';

interface FakePlayer extends SoundPlayer {
  calls: string[];
  isPlaying: boolean;
}

function fakePlayer(log: string[] = []): FakePlayer {
  const player: FakePlayer = {
    calls: log,
    isPlaying: false,
    once: () => player,
    load: () => player.calls.push('load'),
    play: () => player.calls.push('play'),
    playing: () => player.isPlaying,
    rate: (rate) => player.calls.push(`rate:${String(rate)}`),
    volume: (volume) => player.calls.push(`volume:${String(volume)}`),
    mute: (isMuted) => player.calls.push(`mute:${String(isMuted)}`),
    pos: () => player,
  };
  return player;
}

interface TestHost extends SoundHost {
  log: string[];
  isOn: boolean;
  now: number;
  players: FakePlayer[];
}

function testHost(): TestHost {
  const host: TestHost = {
    log: [],
    isOn: true,
    now: 0,
    players: [],
    isInitiated: () => host.isOn,
    elapsed: () => host.now,
    createPlayer: () => {
      const player = fakePlayer(host.log);
      host.players.push(player);
      return player;
    },
  };
  return host;
}

function addItem(group: AudioGroup, host: SoundHost, options: Partial<SoundOptions> = {}): AudioItem {
  const item = new AudioItem({ path: 'sounds/test.mp3', ...options }, group, host);
  group.items.push(item);
  return item;
}

describe('AudioItem.play', () => {
  it('오디오가 시작되기 전에는 재생하지 않는다', () => {
    const host = testHost();
    host.isOn = false;
    const item = addItem(new AudioGroup(), host);
    item.play();
    assert.deepEqual(host.players[0]?.calls, []);
    assert.equal(item.playing, false);
  });

  it('onPlay를 재생 전에 부르고, 0.1초 안의 연속 재생은 막는다', () => {
    const host = testHost();
    const group = new AudioGroup();
    const item = addItem(group, host, {
      onPlay: (played, force) => {
        host.log.push(`onPlay:${String(force)}:${String(played.playing)}:${String(group.lastPlayedId)}`);
      },
    });
    item.play(3);
    host.now = 0.05;
    item.play(4);
    host.now = 0.1;
    item.play(5);
    assert.deepEqual(host.log, ['load', 'onPlay:3:false:-1', 'play', 'onPlay:5:true:0', 'play']);
  });

  it('antiSpam 0이면 매번 재생한다', () => {
    const host = testHost();
    const item = addItem(new AudioGroup(), host, { antiSpam: 0 });
    item.play();
    item.play();
    assert.deepEqual(host.players[0]?.calls, ['load', 'play', 'play']);
  });

  it('시작된 뒤 만든 autoplay 소리는 바로 불러온다', () => {
    const host = testHost();
    const item = addItem(new AudioGroup(), host, { autoplay: true });
    assert.equal(item.playing, true);
    assert.deepEqual(host.players[0]?.calls, ['load']);
  });
});

describe('AudioGroup', () => {
  it('play는 마지막에 재생한 다음 항목을 순서대로 돌린다', () => {
    const host = testHost();
    const group = new AudioGroup();
    const played: number[] = [];
    const onPlay = (item: AudioItem): void => {
      played.push(item.id);
    };
    [0, 1, 2].forEach(() => addItem(group, host, { antiSpam: 0, onPlay }));
    group.play();
    group.play();
    group.play();
    group.play();
    assert.deepEqual(played, [0, 1, 2, 0]);
    assert.equal(group.lastPlayedId, 0);
  });
});

describe('AudioItem.applyMix', () => {
  it('재생 중일 때만 바뀐 값만 적용하고, 거의 안 들리면 음소거한다', () => {
    const host = testHost();
    const item = addItem(new AudioGroup(), host);
    const player = host.players[0];
    assert.ok(player);
    item.applyMix(1, 0.5);
    assert.deepEqual(player.calls, []);

    player.isPlaying = true;
    item.applyMix(1, 0.5);
    item.applyMix(1, 0.5);
    item.applyMix(1.2, 0.005);
    assert.deepEqual(player.calls, ['rate:1', 'volume:0.5', 'mute:false', 'rate:1.2', 'volume:0.005', 'mute:true']);
  });

  it('재생이 끝나면 적용값을 잊어 다음 재생 때 다시 적용한다', () => {
    const host = testHost();
    const item = addItem(new AudioGroup(), host);
    const player = host.players[0];
    assert.ok(player);
    player.isPlaying = true;
    item.applyMix(1, 0.5);
    player.isPlaying = false;
    item.applyMix(1, 0.5);
    player.isPlaying = true;
    item.applyMix(1, 0.5);
    assert.deepEqual(player.calls, ['rate:1', 'volume:0.5', 'mute:false', 'rate:1', 'volume:0.5', 'mute:false']);
  });
});
