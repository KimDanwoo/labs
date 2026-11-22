import { Events } from '@views/drive/lib/engine/game/events';
import { QUALITY, type QualityLevel } from '@views/drive/lib/engine/game/quality';

const RESIZE_SETTLE_MS = 400;
const COMPACT_MAX_WIDTH = 760;
const PIXEL_BUDGET = {
  compact: { [QUALITY.high]: 1_500_000, [QUALITY.low]: 1_500_000 },
  regular: { [QUALITY.high]: 4_000_000, [QUALITY.low]: 2_000_000 },
} satisfies Record<string, Record<QualityLevel, number>>;
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
  #quality: QualityLevel;

  constructor(domElement: HTMLElement, quality: QualityLevel) {
    this.#domElement = domElement;
    this.#quality = quality;
    this.measure();
    addEventListener('resize', this.#handleResize);
  }

  measure(): void {
    const { width, height } = this.#domElement.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.ratio = width / height;
    this.pixelRatioPure = window.devicePixelRatio;

    const isCompact = matchMedia('(pointer: coarse)').matches || width < COMPACT_MAX_WIDTH;
    const size = isCompact ? 'compact' : 'regular';
    const budgetRatio = Math.sqrt(PIXEL_BUDGET[size][this.#quality] / Math.max(1, width * height));
    this.pixelRatioMax = Math.min(MAX_PIXEL_RATIO[size], budgetRatio);
    this.pixelRatio = Math.min(this.pixelRatioPure, this.pixelRatioMax);
  }

  applyQuality(quality: QualityLevel): void {
    this.#quality = quality;
    this.measure();
    this.events.trigger('change');
    this.events.trigger('throttleChange');
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
