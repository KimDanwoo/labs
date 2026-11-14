import { Events } from './events';

const RESIZE_SETTLE_MS = 400;
const COMPACT_MAX_WIDTH = 760;
const PIXEL_BUDGET = { compact: 1_500_000, regular: 4_000_000 } as const;
const MAX_PIXEL_RATIO = { compact: 1.5, regular: 2 } as const;

export class Viewport {
  readonly events = new Events<{ change: []; throttleChange: [] }>();
  width = 0;
  height = 0;
  ratio = 1;
  pixelRatioPure = 1;
  pixelRatioMax = 1;
  pixelRatio = 1;
  readonly #domElement: HTMLElement;
  #settleTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(domElement: HTMLElement) {
    this.#domElement = domElement;
    this.measure();
    addEventListener('resize', this.#handleResize);
  }

  measure(): void {
    const { width, height } = this.#domElement.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.ratio = width / height;
    this.pixelRatioPure = window.devicePixelRatio;

    const size = matchMedia('(pointer: coarse)').matches || width < COMPACT_MAX_WIDTH ? 'compact' : 'regular';
    const budgetRatio = Math.sqrt(PIXEL_BUDGET[size] / Math.max(1, width * height));
    this.pixelRatioMax = Math.min(MAX_PIXEL_RATIO[size], budgetRatio);
    this.pixelRatio = Math.min(this.pixelRatioPure, this.pixelRatioMax);
  }

  #handleResize = (): void => {
    this.measure();
    this.events.trigger('change');
    if (this.#settleTimeout) clearTimeout(this.#settleTimeout);
    this.#settleTimeout = setTimeout(() => {
      this.#settleTimeout = null;
      this.events.trigger('throttleChange');
    }, RESIZE_SETTLE_MS);
  };
}
