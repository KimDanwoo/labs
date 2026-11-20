import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

if (!global.structuredClone) {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

const shouldPolyfillPointerEvent = typeof window !== 'undefined' && !window.PointerEvent;
if (shouldPolyfillPointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
  globalThis.PointerEvent = window.PointerEvent;
}
const shouldPolyfillPointerCapture = typeof Element !== 'undefined' && !Element.prototype.setPointerCapture;
if (shouldPolyfillPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}

const shouldPolyfillMatchMedia = typeof window !== 'undefined' && !window.matchMedia;
if (shouldPolyfillMatchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

beforeEach(() => {
  vi.clearAllMocks();
});
