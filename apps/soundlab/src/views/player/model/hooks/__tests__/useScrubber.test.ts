import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ARIA_UPDATE_MS, KEY_SEEK_SEC } from '../../../config/scrubber';
import { frameState } from '../../store/playback';
import { PlaybackContext } from '../../store/playbackContext';
import type { Playback } from '../usePlayback';
import { useScrubber } from '../useScrubber';

const BAR_LEFT = 100;
const BAR_WIDTH = 200;
const FRAME_MS = 16;
const MAX_FRAMES = 60;

type SeekCall = readonly ['seek' | 'seekBy', number];

async function scrubber(t: TestContext) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  let clock = 0;
  const calls: SeekCall[] = [];
  const values = {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
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
  Object.assign(frameState, { position: 0, level: 0, buffered: 0 });

  const controls: Pick<Playback, 'seek' | 'seekBy'> = {
    seek: (ratio) => calls.push(['seek', ratio]),
    seekBy: (seconds) => calls.push(['seekBy', seconds]),
  };
  function Bar() {
    const { barRef, handlePointerDown, handleMouseDown, handleKeyDown } = useScrubber();
    return createElement('div', {
      ref: barRef,
      id: 'bar',
      onPointerDown: handlePointerDown,
      onMouseDown: handleMouseDown,
      onKeyDown: handleKeyDown,
    });
  }
  const container = dom.window.document.getElementById('root');
  assert.ok(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(PlaybackContext.Provider, { value: controls as Playback }, createElement(Bar)));
  });
  t.after(async () => {
    await act(() => root.unmount());
    dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  const bar = dom.window.document.getElementById('bar');
  assert.ok(bar);
  bar.getBoundingClientRect = () => ({ left: BAR_LEFT, width: BAR_WIDTH }) as DOMRect;

  return {
    bar,
    calls,
    key: (key: string) =>
      act(() => {
        const event = new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        bar.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    mouseDown: () =>
      act(() => {
        const event = new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true });
        bar.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    pointer: (type: 'pointerdown' | 'pointermove' | 'pointerup', clientX = 0) =>
      act(() => {
        const target = type === 'pointerdown' ? bar : dom.window;
        target.dispatchEvent(new dom.window.MouseEvent(type, { clientX, bubbles: true }));
      }),
    frame: () =>
      act(() => {
        const next = frames.entries().next().value;
        assert.ok(next);
        const [id, callback] = next;
        frames.delete(id);
        clock += FRAME_MS;
        callback(clock);
      }),
  };
}

test('arrow keys step by the seek interval and Home/End jump to the edges', async (t) => {
  const app = await scrubber(t);
  for (const key of ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End']) {
    assert.equal(await app.key(key), true, `${key} is handled by the slider`);
  }
  assert.deepEqual(app.calls, [
    ['seekBy', KEY_SEEK_SEC],
    ['seekBy', KEY_SEEK_SEC],
    ['seekBy', -KEY_SEEK_SEC],
    ['seekBy', -KEY_SEEK_SEC],
    ['seek', 0],
    ['seek', 1],
  ]);
});

test('other keys pass through so global shortcuts keep working', async (t) => {
  const app = await scrubber(t);
  assert.equal(await app.key(' '), false);
  assert.equal(await app.key('j'), false);
  assert.deepEqual(app.calls, []);
});

test('a click does not take focus away from the page shortcuts', async (t) => {
  const app = await scrubber(t);
  assert.equal(await app.mouseDown(), true);
});

test('dragging seeks along the bar, clamps outside it and stops on release', async (t) => {
  const app = await scrubber(t);
  await app.pointer('pointerdown', BAR_LEFT + BAR_WIDTH / 4);
  await app.pointer('pointermove', BAR_LEFT + BAR_WIDTH * 2);
  await app.pointer('pointermove', 0);
  await app.pointer('pointerup');
  await app.pointer('pointermove', BAR_LEFT + BAR_WIDTH / 2);
  assert.deepEqual(app.calls, [
    ['seek', 0.25],
    ['seek', 1],
    ['seek', 0],
  ]);
  assert.equal(app.bar.style.getPropertyValue('--p'), '0.00000');
});

test('frames paint the playback position and update the slider value at a slower rate', async (t) => {
  const app = await scrubber(t);
  frameState.position = 0.5;
  await app.frame();
  assert.equal(app.bar.style.getPropertyValue('--p'), '0.50000');
  assert.equal(app.bar.getAttribute('aria-valuenow'), null, 'one frame is too soon for assistive tech');
  let frames = 1;
  while (!app.bar.hasAttribute('aria-valuenow') && frames < MAX_FRAMES) {
    await app.frame();
    frames += 1;
  }
  assert.equal(app.bar.getAttribute('aria-valuenow'), '50');
  assert.ok(frames * FRAME_MS >= ARIA_UPDATE_MS);
});
