import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test, { type TestContext } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { ScWidget } from '../../../api/widget';
import { currentIndexAtom, frameState } from '../../store/playback';
import type { Track } from '../../types/track';
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
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const events = new Map<string, WidgetListener>();
  const skips: number[] = [];
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
    load: () => {},
    play: () => {},
    pause: () => {},
    seekTo: () => {},
    setVolume: () => {},
  };
  const values = {
    window: dom.window,
    document: dom.window.document,
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
