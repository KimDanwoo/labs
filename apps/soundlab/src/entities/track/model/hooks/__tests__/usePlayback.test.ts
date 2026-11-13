import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { type TestContext } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ScWidget } from '../../../api/widget';
import { currentIndexAtom, frameState } from '../../store/playback';
import type { Track } from '../../types/track';
import { useKeyboard } from '../useKeyboard';
import { usePlayback, type Playback } from '../usePlayback';

// TS 훅과 동일한 Jotai 엔트리를 사용한다. ESM/CJS 각각의 Provider 컨텍스트를 섞지 않는다.
const jotai: typeof import('jotai') = createRequire(import.meta.url)('jotai');
const { Provider, createStore } = jotai;

type WidgetListener = Parameters<ScWidget['bind']>[1];
type WidgetPayload = Parameters<WidgetListener>[0];
type SoundsCallback = Parameters<ScWidget['getSounds']>[0];

const TRACKS: Track[] = [1, 2, 3].map((id) => ({
  id,
  title: `Track ${id}`,
  permalinkUrl: `https://soundcloud.com/test/track-${id}`,
  artworkBase: '',
  artworkExt: '.jpg',
  waveformUrl: '',
  durationMs: 120_000,
  genre: 'test',
}));

async function player(t: TestContext) {
  const dom = new JSDOM('<input id="search" /><div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const events = new Map<string, WidgetListener>();
  const skips: number[] = [];
  const loads: string[] = [];
  const seeks: number[] = [];
  let pauses = 0;
  const pending: SoundsCallback[] = [];
  let deferred = false;
  let current = 0;
  const widget: ScWidget = {
    bind: (name, callback) => {
      events.set(name, callback);
    },
    unbind: (name) => {
      events.delete(name);
    },
    getSounds: (callback) => {
      if (deferred) pending.push(callback);
      else callback(TRACKS);
    },
    getCurrentSoundIndex: (callback) => callback(current),
    getDuration: (callback) => callback(120_000),
    skip: (index) => {
      current = index;
      skips.push(index);
    },
    load: (url) => {
      loads.push(url);
    },
    play: () => {},
    pause: () => {
      pauses++;
    },
    seekTo: (ms) => {
      seeks.push(ms);
    },
    setVolume: () => {},
  };
  const values = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    HTMLButtonElement: dom.window.HTMLButtonElement,
    localStorage: dom.window.localStorage,
    SC: { Widget: () => widget },
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    reportError: (error: unknown) => {
      throw error;
    },
  };
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  Object.assign(frameState, { position: 0, durationMs: 0, buffered: 0 });
  const store = createStore();
  let controls: Playback | undefined;
  function Harness() {
    controls = usePlayback(TRACKS);
    useKeyboard(controls);
    return null;
  }
  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);
  let mounted = true;
  const unmount = async () => {
    if (mounted) {
      await act(() => root.unmount());
      mounted = false;
    }
  };
  t.after(async () => {
    await unmount();
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  await act(async () => {
    root.render(createElement(Provider, { store }, createElement(Harness)));
  });
  return {
    store,
    skips,
    loads,
    seeks,
    pauseCount: () => pauses,
    startQueue: (ids: readonly number[]) =>
      act(() => {
        assert.ok(controls);
        controls.startQueue({ ids, label: 'test' });
      }),
    retry: () =>
      act(() => {
        assert.ok(controls);
        controls.retry();
      }),
    playFrom: (ms: number) =>
      act(() => {
        assert.ok(controls);
        controls.playFrom(ms);
      }),
    inputKey: (key: string) =>
      act(() => {
        dom.window.document
          .getElementById('search')
          ?.dispatchEvent(
            new dom.window.KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : key, bubbles: true }),
          );
      }),
    pending,
    events,
    unmount,
    select: (index: number) =>
      act(() => {
        assert.ok(controls);
        controls.select(index);
      }),
    emit: (event: string, payload: WidgetPayload = {}) => act(() => events.get(event)?.(payload)),
    defer: () => {
      deferred = true;
    },
    flush: (index: number) =>
      act(() => {
        const callback = pending[index];
        assert.ok(callback);
        callback(TRACKS);
      }),
    frame: () =>
      act(() => {
        const next = frames.entries().next().value;
        assert.ok(next);
        const [id, callback] = next;
        frames.delete(id);
        callback(performance.now());
      }),
  };
}

test('a track selected before widget readiness plays when the widget becomes ready', async (t) => {
  const app = await player(t);
  await app.select(2);
  assert.equal(app.store.get(currentIndexAtom), 2);
  assert.deepEqual(app.skips, []);
  await app.emit('ready');
  assert.deepEqual(app.skips, [2]);
});

test('rapid selections ignore callbacks from the older request', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  app.defer();
  await app.select(1);
  await app.select(2);
  await app.flush(1);
  await app.flush(0);
  assert.deepEqual(app.skips, [2]);
  assert.equal(app.store.get(currentIndexAtom), 2);
});

test('unmount releases widget listeners and invalidates pending selections', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  app.defer();
  await app.select(1);
  await app.unmount();
  assert.equal(app.events.size, 0);
  await app.flush(0);
  assert.deepEqual(app.skips, []);
});

test('malformed widget progress cannot corrupt the playback clock', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  await app.emit('playProgress', { currentPosition: NaN });
  await app.frame();
  assert.ok(Number.isFinite(frameState.position));
  await app.emit('playProgress', { currentPosition: -100 });
  await app.frame();
  assert.ok(frameState.position >= 0);
});

test('custom queue follows its order and stops after its final track', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  await app.startQueue([3, 1]);
  assert.equal(app.store.get(currentIndexAtom), 2);
  assert.equal(app.loads.at(-1), 'https://api.soundcloud.com/tracks/3');
  await app.emit('finish');
  assert.equal(app.store.get(currentIndexAtom), 0);
  assert.equal(app.loads.at(-1), 'https://api.soundcloud.com/tracks/1');
  const before = app.loads.length;
  await app.emit('finish');
  assert.equal(app.loads.length, before);
  assert.ok(app.pauseCount() > 0);
});

test('retry rebuilds the engine and preserves the requested track', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  await app.select(2);
  await app.retry();
  assert.equal(document.querySelectorAll('iframe').length, 1);
  await app.emit('ready');
  assert.equal(app.store.get(currentIndexAtom), 2);
});

test('highlight seeking works while the current track is already playing', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  await app.select(0);
  await app.emit('play');
  await app.playFrom(42_000);
  assert.equal(app.seeks.at(-1), 42_000);
  assert.equal(frameState.position, 0.35);
});

test('typing playback shortcuts into search does not seek or change tracks', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  const seeks = app.seeks.length;
  for (const key of ['k', ' ', 'l', 'j', '9', 'Home', 'ArrowLeft']) await app.inputKey(key);
  assert.equal(app.seeks.length, seeks);
  assert.equal(app.store.get(currentIndexAtom), 0);
});

test('engine readiness alone never starts a song', async (t) => {
  const app = await player(t);
  await app.emit('ready');
  assert.deepEqual(app.skips, []);
  assert.deepEqual(app.loads, []);
});
