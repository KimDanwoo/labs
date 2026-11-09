import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { usePlayback } from '../src/entities/track/model/hooks/usePlayback.ts';
import { currentIndexAtom, frameState } from '../src/entities/track/model/store/playback.ts';

// TS 훅과 동일한 Jotai 엔트리를 사용한다. ESM/CJS 각각의 Provider 컨텍스트를 섞지 않는다.
const { Provider, createStore } = createRequire(import.meta.url)('jotai');

const TRACKS = [1, 2, 3].map((id) => ({
  id,
  title: `Track ${id}`,
  permalinkUrl: `https://soundcloud.com/test/track-${id}`,
  artworkBase: '',
  artworkExt: '.jpg',
  waveformUrl: '',
  durationMs: 120_000,
  genre: 'test',
}));

async function player(t) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map();
  const frames = new Map();
  let nextFrame = 0;
  const events = new Map();
  const skips = [];
  const pending = [];
  let deferred = false;
  let current = 0;
  const widget = {
    bind: (name, callback) => events.set(name, callback),
    unbind: (name) => events.delete(name),
    getSounds: (callback) => (deferred ? pending.push(callback) : callback(TRACKS)),
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
    requestAnimationFrame: (callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    reportError: (error) => {
      throw error;
    },
  };
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  Object.assign(frameState, { position: 0, durationMs: 0, buffered: 0 });
  const store = createStore();
  let controls;
  function Harness() {
    controls = usePlayback(TRACKS);
    return null;
  }
  const root = createRoot(dom.window.document.getElementById('root'));
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
      else delete globalThis[name];
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
    select: (index) => act(() => controls.select(index)),
    emit: (event, payload) => act(() => events.get(event)?.(payload)),
    defer: () => {
      deferred = true;
    },
    flush: (index) => act(() => pending[index](TRACKS)),
    frame: () =>
      act(() => {
        const [id, callback] = frames.entries().next().value;
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
