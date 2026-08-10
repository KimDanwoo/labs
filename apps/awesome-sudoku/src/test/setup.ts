import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

if (!global.structuredClone) {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

// jsdom 미구현 — 포인터 제스처 테스트에 필요 (MouseEvent가 clientX/clientY를 이미 지원한다)
if (typeof window !== 'undefined' && !window.PointerEvent) {
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
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}

// jsdom 미구현 — 반응형 훅이 있는 컴포넌트 렌더링에 필요
if (typeof window !== 'undefined' && !window.matchMedia) {
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
