import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import type { JukeboxTrack } from '@views/drive/lib/engine/data/worldContent';
import { Events } from '@views/drive/lib/engine/game/events';
import { JukeboxPlayer } from '@views/drive/lib/engine/game/jukebox/jukeboxPlayer';
import { type MusicHost } from '@views/drive/lib/engine/game/jukebox/jukeboxTypes';
import type {
  SoundCloudGlobal,
  SoundCloudWidget,
  WidgetEvent,
  WidgetPayload,
} from '@views/drive/lib/engine/game/jukebox/soundcloudWidget';

const TRACKS: JukeboxTrack[] = [1, 2, 3].map((id) => ({
  id,
  title: `곡 ${id}`,
  url: `https://soundcloud.com/danwooking/${id}`,
  artwork: `https://i1.sndcdn.com/${id}.jpg`,
  durationMs: 1000,
}));
const EVENTS = {
  READY: 'READY',
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  FINISH: 'FINISH',
  PLAY_PROGRESS: 'PLAY_PROGRESS',
  ERROR: 'ERROR',
};

interface FakeWidget extends SoundCloudWidget {
  readonly calls: string[];
  emit(event: WidgetEvent, payload?: WidgetPayload): void;
}

function fakeWidget(): FakeWidget {
  const handlers = new Map<string, (payload?: WidgetPayload) => void>();
  const calls: string[] = [];
  return {
    calls,
    bind: (event, callback) => handlers.set(event, callback),
    load: (url, options) => {
      calls.push(`load ${url}`);
      options?.callback?.();
    },
    play: () => calls.push('play'),
    pause: () => calls.push('pause'),
    setVolume: (volume) => calls.push(`volume ${volume}`),
    emit: (event, payload) => handlers.get(event)?.(payload),
  };
}

function fakeMusic(isMuted: boolean): MusicHost & { owner: string } {
  return {
    owner: 'island',
    isBackground: false,
    mute: { active: isMuted },
    events: new Events(),
    claimMusic() {
      this.owner = 'jukebox';
    },
    releaseMusic() {
      this.owner = 'island';
    },
  };
}

function setup({ isMuted = false }: { isMuted?: boolean } = {}): {
  player: JukeboxPlayer;
  widget: FakeWidget;
  music: ReturnType<typeof fakeMusic>;
  mounts: () => number;
} {
  const widget = fakeWidget();
  const music = fakeMusic(isMuted);
  let mountCount = 0;
  const api: SoundCloudGlobal = { Widget: Object.assign(() => widget, { Events: EVENTS }) };
  const player = new JukeboxPlayer({
    tracks: TRACKS,
    music,
    announce: () => {},
    loadApi: () => Promise.resolve(api),
    mountFrame: () => {
      mountCount += 1;
      return { remove: () => {} };
    },
  });
  return { player, widget, music, mounts: () => mountCount };
}

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

test('준비 중에 정지하면 늦게 온 READY가 재생을 되살리지 않는다', async () => {
  const { player, widget, music } = setup();
  player.select(1);
  await flush();
  player.stop();
  widget.emit('READY');
  assert.equal(player.state.status, 'ready');
  assert.equal(music.owner, 'island');
  assert.ok(!widget.calls.includes('play'));
});

test('정지 후 늦은 FINISH는 다음 곡으로 넘기지 않는다', async () => {
  const { player, widget } = setup();
  void player.prepare();
  await flush();
  widget.emit('READY');
  player.select(0);
  widget.emit('PLAY', { soundId: 1 });
  player.stop();
  const loads = widget.calls.filter((call) => call.startsWith('load')).length;
  widget.emit('FINISH', { soundId: 1 });
  assert.equal(widget.calls.filter((call) => call.startsWith('load')).length, loads);
});

test('이전 곡의 PLAY는 새로 고른 곡을 재생 중으로 확정하지 않는다', async () => {
  const { player, widget } = setup();
  void player.prepare();
  await flush();
  widget.emit('READY');
  player.select(0);
  widget.emit('PLAY', { soundId: 1 });
  player.select(2);
  widget.emit('PLAY', { soundId: 1 });
  assert.equal(player.state.status, 'starting');
  widget.emit('PLAY', { soundId: 3 });
  assert.equal(player.state.status, 'playing');
  assert.equal(player.state.trackIndex, 2);
});

test('시작 중 일시정지는 바로 멈춤 상태가 되고 늦은 PLAY는 다시 멈춘다', async () => {
  const { player, widget } = setup();
  void player.prepare();
  await flush();
  widget.emit('READY');
  player.select(1);
  player.toggle();
  assert.equal(player.state.status, 'paused');
  widget.emit('PLAY', { soundId: 2 });
  assert.equal(player.state.status, 'paused');
  assert.equal(widget.calls.at(-1), 'pause');
});

test('READY가 오지 않으면 오류로 바꾸고 배경음을 돌려준 뒤 다시 준비할 수 있다', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const reported: unknown[] = [];
  const originalReport = globalThis.reportError;
  globalThis.reportError = (error: unknown) => reported.push(error);
  try {
    const { player, music, mounts } = setup();
    player.select(0);
    await flush();
    mock.timers.tick(12_000);
    await flush();
    assert.equal(player.state.status, 'error');
    assert.equal(music.owner, 'island');
    assert.equal(reported.length, 1);
    void player.prepare();
    await flush();
    assert.equal(mounts(), 2);
  } finally {
    globalThis.reportError = originalReport;
    mock.timers.reset();
  }
});

test('음소거 상태로 준비되면 위젯 볼륨을 0으로 맞춘다', async () => {
  const { player, widget } = setup({ isMuted: true });
  void player.prepare();
  await flush();
  widget.emit('READY');
  assert.ok(widget.calls.includes('volume 0'));
});

test('미리 준비해 두면 첫 곡 선택이 다시 불러오지 않고 바로 재생한다', async () => {
  const { player, widget } = setup();
  void player.prepare();
  await flush();
  widget.emit('READY');
  assert.equal(player.state.status, 'ready');
  assert.equal(player.state.trackIndex, null);
  player.select(0);
  assert.equal(widget.calls.at(-1), 'play');
  assert.ok(!widget.calls.some((call) => call.startsWith('load')));
});
